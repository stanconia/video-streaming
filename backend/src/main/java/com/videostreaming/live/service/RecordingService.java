package com.videostreaming.live.service;

import com.videostreaming.shared.service.S3Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.videostreaming.live.model.Recording;
import com.videostreaming.live.model.RecordingStatus;
import com.videostreaming.live.model.Room;
import com.videostreaming.live.dto.RecordingResponse;
import com.videostreaming.live.repository.RecordingRepository;
import com.videostreaming.live.repository.RoomRepository;
import com.videostreaming.live.websocket.SignalingWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RecordingService {

    private static final Logger logger = LoggerFactory.getLogger(RecordingService.class);

    private final RecordingRepository recordingRepository;
    private final RoomRepository roomRepository;
    private final MediaServerClient mediaServerClient;
    private final S3Service s3Service;
    private final ObjectMapper objectMapper;
    private final SignalingWebSocketHandler signalingWebSocketHandler;

    public RecordingService(RecordingRepository recordingRepository,
                            RoomRepository roomRepository,
                            MediaServerClient mediaServerClient,
                            S3Service s3Service,
                            ObjectMapper objectMapper,
                            SignalingWebSocketHandler signalingWebSocketHandler) {
        this.recordingRepository = recordingRepository;
        this.roomRepository = roomRepository;
        this.mediaServerClient = mediaServerClient;
        this.s3Service = s3Service;
        this.objectMapper = objectMapper;
        this.signalingWebSocketHandler = signalingWebSocketHandler;
    }

    @Transactional
    public RecordingResponse startRecording(String roomId, String userId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        if (!room.isActive()) {
            throw new IllegalStateException("Room is not active");
        }

        // Clean up stale recordings (stuck in RECORDING/STARTING/STOPPING/UPLOADING for > 30 min)
        cleanupStaleRecordings();

        recordingRepository.findByRoomIdAndStatus(roomId, RecordingStatus.RECORDING)
                .ifPresent(r -> {
                    throw new IllegalStateException("Recording already in progress for this room");
                });

        Recording recording = Recording.builder()
                .roomId(roomId)
                .roomName(room.getName())
                .startedByUserId(userId)
                .status(RecordingStatus.STARTING)
                .build();
        recording = recordingRepository.save(recording);

        try {
            String message = objectMapper.writeValueAsString(Map.of(
                    "type", "start-recording",
                    "roomId", roomId,
                    "recordingId", recording.getId()
            ));
            String response = mediaServerClient.forwardSignalingMessage(message, "system");
            JsonNode responseNode = objectMapper.readTree(response);

            if (responseNode.has("success") && responseNode.get("success").asBoolean()) {
                recording.setStatus(RecordingStatus.RECORDING);
                recordingRepository.save(recording);
                signalingWebSocketHandler.broadcastRecordingStatus(roomId, true);
                logger.info("Recording started for room {}: {}", roomId, recording.getId());
            } else {
                String error = responseNode.has("error") ? responseNode.get("error").asText() : "Unknown error";
                recording.setStatus(RecordingStatus.FAILED);
                recording.setErrorMessage(error);
                recordingRepository.save(recording);
                throw new RuntimeException("Failed to start recording: " + error);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            recording.setStatus(RecordingStatus.FAILED);
            recording.setErrorMessage(e.getMessage());
            recordingRepository.save(recording);
            throw new RuntimeException("Failed to start recording", e);
        }

        return toResponse(recording, null);
    }

    @Transactional
    public RecordingResponse stopRecording(String roomId, String userId) {
        Recording recording = recordingRepository.findByRoomIdAndStatus(roomId, RecordingStatus.RECORDING)
                .orElseThrow(() -> new IllegalStateException("No active recording for this room"));

        recording.setStatus(RecordingStatus.STOPPING);
        recordingRepository.save(recording);

        try {
            String message = objectMapper.writeValueAsString(Map.of(
                    "type", "stop-recording",
                    "roomId", roomId
            ));
            String response = mediaServerClient.forwardSignalingMessage(message, "system");
            JsonNode responseNode = objectMapper.readTree(response);

            if (!responseNode.has("success") || !responseNode.get("success").asBoolean()) {
                String error = responseNode.has("error") ? responseNode.get("error").asText() : "Unknown error";
                recording.setStatus(RecordingStatus.FAILED);
                recording.setErrorMessage(error);
                recordingRepository.save(recording);
                throw new RuntimeException("Failed to stop recording: " + error);
            }

            long durationMs = responseNode.has("durationMs") ? responseNode.get("durationMs").asLong() : 0;
            recording.setDurationMs(durationMs);

            // Broadcast status change
            signalingWebSocketHandler.broadcastRecordingStatus(roomId, false);

            // Upload to S3
            recording.setStatus(RecordingStatus.UPLOADING);
            recordingRepository.save(recording);

            byte[] fileData = mediaServerClient.downloadRecordingFile(recording.getId());

            String s3Key = String.format("recordings/%s/%s/%s.webm",
                    roomId,
                    recording.getCreatedAt().toLocalDate().toString(),
                    recording.getId());

            s3Service.uploadFile(s3Key, fileData, "video/webm");

            recording.setS3Key(s3Key);
            recording.setS3Bucket(s3Service.getBucketName());
            recording.setFileSizeBytes((long) fileData.length);
            recording.setStatus(RecordingStatus.COMPLETED);
            recording.setCompletedAt(LocalDateTime.now());
            recordingRepository.save(recording);

            logger.info("Recording completed for room {}: {} ({} bytes)", roomId, recording.getId(), fileData.length);

            return toResponse(recording, null);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            recording.setStatus(RecordingStatus.FAILED);
            recording.setErrorMessage(e.getMessage());
            recordingRepository.save(recording);
            throw new RuntimeException("Failed to stop recording", e);
        }
    }

    public RecordingResponse getRecording(String recordingId) {
        Recording recording = recordingRepository.findById(recordingId)
                .orElseThrow(() -> new IllegalArgumentException("Recording not found"));

        String playbackUrl = null;
        if (recording.getStatus() == RecordingStatus.COMPLETED && recording.getS3Key() != null) {
            playbackUrl = s3Service.generatePresignedUrl(recording.getS3Key(), 3600);
        }

        return toResponse(recording, playbackUrl);
    }

    public List<RecordingResponse> getRecordingsForRoom(String roomId) {
        return recordingRepository.findByRoomIdOrderByCreatedAtDesc(roomId).stream()
                .map(r -> toResponse(r, null))
                .collect(Collectors.toList());
    }

    public List<RecordingResponse> getAllRecordings() {
        return recordingRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(r -> toResponse(r, null))
                .collect(Collectors.toList());
    }

    private void cleanupStaleRecordings() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30);
        List<RecordingStatus> staleStatuses = List.of(
                RecordingStatus.RECORDING, RecordingStatus.STARTING,
                RecordingStatus.STOPPING, RecordingStatus.UPLOADING);

        for (RecordingStatus status : staleStatuses) {
            List<Recording> stale = recordingRepository.findByStatusAndCreatedAtBefore(status, cutoff);
            for (Recording r : stale) {
                logger.warn("Marking stale recording {} as FAILED (was {} since {})", r.getId(), r.getStatus(), r.getCreatedAt());
                r.setStatus(RecordingStatus.FAILED);
                r.setErrorMessage("Recording timed out (stale for >30 minutes)");
                recordingRepository.save(r);
            }
        }
    }

    private RecordingResponse toResponse(Recording r, String playbackUrl) {
        String captionUrl = null;
        if (r.getCaptionS3Key() != null) {
            captionUrl = s3Service.generatePresignedUrl(r.getCaptionS3Key(), 3600);
        }
        return new RecordingResponse(
                r.getId(),
                r.getRoomId(),
                r.getRoomName(),
                r.getStartedByUserId(),
                r.getStatus().name(),
                r.getDurationMs(),
                r.getFileSizeBytes(),
                playbackUrl,
                captionUrl,
                r.getCreatedAt(),
                r.getCompletedAt()
        );
    }
}
