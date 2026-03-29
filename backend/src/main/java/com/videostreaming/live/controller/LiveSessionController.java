package com.videostreaming.live.controller;

import com.videostreaming.live.dto.CreateLiveSessionRequest;
import com.videostreaming.live.dto.LiveSessionResponse;
import com.videostreaming.live.service.LiveSessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/live-sessions")
public class LiveSessionController {

    private final LiveSessionService liveSessionService;

    public LiveSessionController(LiveSessionService liveSessionService) {
        this.liveSessionService = liveSessionService;
    }

    @PostMapping
    public ResponseEntity<?> scheduleLiveSession(@RequestBody CreateLiveSessionRequest request,
                                                  Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(liveSessionService.scheduleLiveSession(userId, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<LiveSessionResponse>> getSessions(
            @RequestParam String courseId,
            @RequestParam(required = false) String moduleId) {
        if (moduleId != null && !moduleId.isEmpty()) {
            return ResponseEntity.ok(liveSessionService.getSessionsForModule(courseId, moduleId));
        }
        return ResponseEntity.ok(liveSessionService.getSessionsForCourse(courseId));
    }

    @GetMapping("/my-upcoming")
    public ResponseEntity<List<LiveSessionResponse>> getMyUpcomingSessions(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(liveSessionService.getUpcomingSessionsForStudent(userId));
    }

    @GetMapping("/my-teaching")
    public ResponseEntity<List<LiveSessionResponse>> getMyTeachingSessions(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(liveSessionService.getSessionsForTeacher(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSession(@PathVariable String id) {
        try {
            return ResponseEntity.ok(liveSessionService.getSession(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<?> startSession(@PathVariable String id, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(liveSessionService.startSession(id, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<?> endSession(@PathVariable String id, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(liveSessionService.endSession(id, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelSession(@PathVariable String id, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            liveSessionService.cancelSession(id, userId);
            return ResponseEntity.ok(Map.of("message", "Session cancelled"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
