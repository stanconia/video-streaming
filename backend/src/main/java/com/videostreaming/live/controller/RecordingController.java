package com.videostreaming.live.controller;

import com.videostreaming.live.dto.RecordingResponse;
import com.videostreaming.live.dto.StartRecordingRequest;
import com.videostreaming.live.dto.StopRecordingRequest;
import com.videostreaming.live.service.RecordingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recordings")
public class RecordingController {

    private final RecordingService recordingService;

    public RecordingController(RecordingService recordingService) {
        this.recordingService = recordingService;
    }

    @PostMapping("/start")
    public ResponseEntity<?> startRecording(@RequestBody StartRecordingRequest request) {
        try {
            RecordingResponse response = recordingService.startRecording(request.getRoomId(), request.getUserId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/stop")
    public ResponseEntity<?> stopRecording(@RequestBody StopRecordingRequest request) {
        try {
            RecordingResponse response = recordingService.stopRecording(request.getRoomId(), request.getUserId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRecording(@PathVariable String id) {
        try {
            RecordingResponse response = recordingService.getRecording(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<RecordingResponse>> getRecordings(
            @RequestParam(required = false) String roomId) {
        List<RecordingResponse> recordings = roomId != null
                ? recordingService.getRecordingsForRoom(roomId)
                : recordingService.getAllRecordings();
        return ResponseEntity.ok(recordings);
    }

    @GetMapping("/{id}/playback")
    public ResponseEntity<?> getPlaybackUrl(@PathVariable String id) {
        try {
            RecordingResponse recording = recordingService.getRecording(id);
            if (recording.getPlaybackUrl() == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Recording not available for playback"));
            }
            return ResponseEntity.ok(Map.of("url", recording.getPlaybackUrl()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
