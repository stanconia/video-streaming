package com.videostreaming.progress.controller;

import com.videostreaming.progress.dto.CourseProgressResponse;
import com.videostreaming.progress.service.ProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @PostMapping("/{enrollmentId}/lessons/{lessonId}/complete")
    public ResponseEntity<?> markLessonComplete(@PathVariable String enrollmentId,
                                                 @PathVariable String lessonId,
                                                 Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            CourseProgressResponse.LessonProgressItem result =
                    progressService.markLessonComplete(userId, enrollmentId, lessonId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{enrollmentId}")
    public ResponseEntity<?> getCourseProgress(@PathVariable String enrollmentId,
                                                Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            CourseProgressResponse response = progressService.getCourseProgress(userId, enrollmentId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllProgress(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            List<CourseProgressResponse> response = progressService.getAllProgress(userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
