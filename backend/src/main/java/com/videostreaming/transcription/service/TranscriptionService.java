package com.videostreaming.transcription.service;

import com.videostreaming.live.model.Recording;
import com.videostreaming.live.model.RecordingStatus;
import com.videostreaming.live.repository.RecordingRepository;
import com.videostreaming.shared.service.S3Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class TranscriptionService {

    private static final Logger logger = LoggerFactory.getLogger(TranscriptionService.class);

    private final RecordingRepository recordingRepository;
    private final S3Service s3Service;
    private final RestTemplate restTemplate;

    @Value("${transcription.enabled:false}")
    private boolean transcriptionEnabled;

    @Value("${transcription.url:http://localhost:9000}")
    private String transcriptionUrl;

    public TranscriptionService(RecordingRepository recordingRepository,
                                S3Service s3Service) {
        this.recordingRepository = recordingRepository;
        this.s3Service = s3Service;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Triggers transcription for a recording. Downloads the WebM file from S3,
     * sends it to the transcription service (or generates a stub), converts to
     * WebVTT, and uploads the VTT file back to S3.
     */
    @Async
    public void transcribeRecording(String recordingId) {
        Recording recording = recordingRepository.findById(recordingId)
                .orElseThrow(() -> new IllegalArgumentException("Recording not found: " + recordingId));

        if (recording.getStatus() != RecordingStatus.COMPLETED) {
            throw new IllegalStateException("Recording is not completed yet. Current status: " + recording.getStatus());
        }

        if (recording.getS3Key() == null) {
            throw new IllegalStateException("Recording has no S3 key — file not uploaded");
        }

        if (recording.getCaptionS3Key() != null) {
            logger.info("Recording {} already has captions at {}", recordingId, recording.getCaptionS3Key());
            return;
        }

        logger.info("Starting transcription for recording {}", recordingId);

        try {
            String vttContent;

            if (transcriptionEnabled) {
                vttContent = transcribeViaService(recording);
            } else {
                logger.info("Transcription service disabled — generating stub captions for recording {}", recordingId);
                vttContent = generateStubVtt(recording);
            }

            // Build the S3 key for the VTT file, mirroring the recording path
            String captionS3Key = buildCaptionS3Key(recording);

            // Upload the VTT file to S3
            byte[] vttBytes = vttContent.getBytes(StandardCharsets.UTF_8);
            s3Service.uploadFile(captionS3Key, vttBytes, "text/vtt");

            // Update the recording entity
            recording.setCaptionS3Key(captionS3Key);
            recordingRepository.save(recording);

            logger.info("Transcription complete for recording {}. Caption stored at {}", recordingId, captionS3Key);

        } catch (Exception e) {
            logger.error("Transcription failed for recording {}: {}", recordingId, e.getMessage(), e);
            throw new RuntimeException("Transcription failed for recording " + recordingId, e);
        }
    }

    /**
     * Returns a presigned URL for the VTT caption file of a recording.
     */
    public String getCaptionUrl(String recordingId) {
        Recording recording = recordingRepository.findById(recordingId)
                .orElseThrow(() -> new IllegalArgumentException("Recording not found: " + recordingId));

        if (recording.getCaptionS3Key() == null) {
            return null;
        }

        return s3Service.generatePresignedUrl(recording.getCaptionS3Key(), 3600);
    }

    /**
     * Checks whether captions exist for a given recording.
     */
    public boolean hasCaptions(String recordingId) {
        return recordingRepository.findById(recordingId)
                .map(r -> r.getCaptionS3Key() != null)
                .orElse(false);
    }

    /**
     * Calls the external transcription service (e.g., Whisper) to transcribe
     * the recording audio and returns WebVTT content.
     */
    private String transcribeViaService(Recording recording) {
        logger.info("Downloading recording {} from S3 for transcription", recording.getId());
        byte[] audioData = s3Service.downloadFile(recording.getS3Key());

        logger.info("Sending {} bytes to transcription service at {}", audioData.length, transcriptionUrl);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.set("X-Recording-Id", recording.getId());
        headers.setAccept(List.of(MediaType.parseMediaType("text/vtt"), MediaType.APPLICATION_JSON));

        HttpEntity<byte[]> requestEntity = new HttpEntity<>(audioData, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                transcriptionUrl + "/transcribe",
                HttpMethod.POST,
                requestEntity,
                String.class
        );

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Transcription service returned status " + response.getStatusCode());
        }

        String body = response.getBody();

        // If the response is already in VTT format, return directly
        if (body.trim().startsWith("WEBVTT")) {
            return body;
        }

        // Otherwise, assume it's a JSON response with segments and convert to VTT
        return convertToWebVtt(body);
    }

    /**
     * Converts a JSON transcription response (with segments) to WebVTT format.
     * Expected JSON structure: { "segments": [ { "start": 0.0, "end": 2.5, "text": "Hello" }, ... ] }
     */
    private String convertToWebVtt(String jsonResponse) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(jsonResponse);
            com.fasterxml.jackson.databind.JsonNode segments = root.get("segments");

            if (segments == null || !segments.isArray()) {
                throw new RuntimeException("Invalid transcription response: no segments array");
            }

            StringBuilder vtt = new StringBuilder("WEBVTT\n\n");
            int index = 1;

            for (com.fasterxml.jackson.databind.JsonNode segment : segments) {
                double start = segment.get("start").asDouble();
                double end = segment.get("end").asDouble();
                String text = segment.get("text").asText().trim();

                vtt.append(index).append("\n");
                vtt.append(formatTimestamp(start)).append(" --> ").append(formatTimestamp(end)).append("\n");
                vtt.append(text).append("\n\n");
                index++;
            }

            return vtt.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to convert transcription response to WebVTT", e);
        }
    }

    /**
     * Formats a time in seconds to WebVTT timestamp format: HH:MM:SS.mmm
     */
    private String formatTimestamp(double seconds) {
        int hours = (int) (seconds / 3600);
        int minutes = (int) ((seconds % 3600) / 60);
        int secs = (int) (seconds % 60);
        int millis = (int) ((seconds % 1) * 1000);
        return String.format("%02d:%02d:%02d.%03d", hours, minutes, secs, millis);
    }

    /**
     * Generates a stub WebVTT file for development/testing when the transcription
     * service is not available.
     */
    private String generateStubVtt(Recording recording) {
        long durationMs = recording.getDurationMs() != null ? recording.getDurationMs() : 60000;
        double durationSec = durationMs / 1000.0;

        StringBuilder vtt = new StringBuilder("WEBVTT\n\n");

        vtt.append("1\n");
        vtt.append("00:00:00.000 --> 00:00:05.000\n");
        vtt.append("[Auto-generated captions]\n\n");

        vtt.append("2\n");
        vtt.append("00:00:05.000 --> 00:00:10.000\n");
        vtt.append("Welcome to this recorded session: ").append(recording.getRoomName()).append("\n\n");

        vtt.append("3\n");
        vtt.append("00:00:10.000 --> 00:00:15.000\n");
        vtt.append("This is a placeholder caption track.\n\n");

        vtt.append("4\n");
        vtt.append("00:00:15.000 --> 00:00:20.000\n");
        vtt.append("Enable the transcription service for real captions.\n\n");

        if (durationSec > 30) {
            vtt.append("5\n");
            vtt.append(formatTimestamp(durationSec - 5)).append(" --> ").append(formatTimestamp(durationSec)).append("\n");
            vtt.append("End of recording.\n\n");
        }

        return vtt.toString();
    }

    /**
     * Builds the S3 key for a caption file, placing it alongside the recording.
     * Pattern: recordings/{roomId}/{date}/{recordingId}.vtt
     */
    private String buildCaptionS3Key(Recording recording) {
        return String.format("recordings/%s/%s/%s.vtt",
                recording.getRoomId(),
                recording.getCreatedAt().toLocalDate().toString(),
                recording.getId());
    }
}
