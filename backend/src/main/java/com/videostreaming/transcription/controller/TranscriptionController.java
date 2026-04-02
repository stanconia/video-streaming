package com.videostreaming.transcription.controller;

import com.videostreaming.transcription.service.TranscriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/recordings")
public class TranscriptionController {

    private final TranscriptionService transcriptionService;

    public TranscriptionController(TranscriptionService transcriptionService) {
        this.transcriptionService = transcriptionService;
    }

    /**
     * Triggers transcription for a recording. Only teachers (the user who started
     * the recording) should be able to trigger this.
     */
    @PostMapping("/{id}/transcribe")
    public ResponseEntity<?> transcribeRecording(@PathVariable String id,
                                                  Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            // Transcription runs asynchronously
            transcriptionService.transcribeRecording(id);
            return ResponseEntity.accepted().body(Map.of(
                    "message", "Transcription started",
                    "recordingId", id
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to start transcription: " + e.getMessage()));
        }
    }

    /**
     * Returns the presigned URL for the caption (VTT) file of a recording.
     */
    @GetMapping("/{id}/captions")
    public ResponseEntity<?> getCaptions(@PathVariable String id) {
        try {
            String captionUrl = transcriptionService.getCaptionUrl(id);
            if (captionUrl == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(Map.of("url", captionUrl));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
