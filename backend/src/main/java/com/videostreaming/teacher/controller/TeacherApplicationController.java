package com.videostreaming.teacher.controller;

import com.videostreaming.teacher.dto.TeacherApplicationResponse;
import com.videostreaming.teacher.service.TeacherApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/teacher-applications")
public class TeacherApplicationController {

    private final TeacherApplicationService teacherApplicationService;

    public TeacherApplicationController(TeacherApplicationService teacherApplicationService) {
        this.teacherApplicationService = teacherApplicationService;
    }

    @PostMapping
    public ResponseEntity<?> submitApplication(@RequestBody(required = false) Map<String, String> body,
                                                Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            String notes = body != null ? body.get("notes") : null;
            return ResponseEntity.ok(teacherApplicationService.submitApplication(userId, notes));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyApplication(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        TeacherApplicationResponse response = teacherApplicationService.getMyApplication(userId);
        if (response == null) {
            return ResponseEntity.ok(Map.of());
        }
        return ResponseEntity.ok(response);
    }
}
