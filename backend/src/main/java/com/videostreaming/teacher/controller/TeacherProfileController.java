package com.videostreaming.teacher.controller;

import com.videostreaming.teacher.dto.TeacherProfileRequest;
import com.videostreaming.teacher.dto.TeacherProfileResponse;
import com.videostreaming.teacher.service.TeacherProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teachers")
public class TeacherProfileController {

    private final TeacherProfileService teacherProfileService;

    public TeacherProfileController(TeacherProfileService teacherProfileService) {
        this.teacherProfileService = teacherProfileService;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(teacherProfileService.getMyProfile(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody TeacherProfileRequest request,
                                            Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(teacherProfileService.updateProfile(userId, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getTeacherProfile(@PathVariable String userId) {
        try {
            return ResponseEntity.ok(teacherProfileService.getTeacherProfile(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<TeacherProfileResponse>> searchTeachers(
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(teacherProfileService.searchTeachers(subject, query));
    }
}
