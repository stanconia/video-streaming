package com.videostreaming.admin.controller;

import com.videostreaming.admin.dto.AdminStatsResponse;
import com.videostreaming.teacher.dto.TeacherApplicationResponse;
import com.videostreaming.user.dto.UserSummaryResponse;
import com.videostreaming.admin.service.AdminService;
import com.videostreaming.teacher.service.TeacherApplicationService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final TeacherApplicationService teacherApplicationService;

    public AdminController(AdminService adminService, TeacherApplicationService teacherApplicationService) {
        this.adminService = adminService;
        this.teacherApplicationService = teacherApplicationService;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserSummaryResponse>> getUsers(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getUsers(page, size));
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<?> changeUserRole(@PathVariable String userId,
                                             @RequestBody Map<String, String> body,
                                             Authentication authentication) {
        try {
            String adminUserId = (String) authentication.getPrincipal();
            String newRole = body.get("role");
            return ResponseEntity.ok(adminService.changeUserRole(userId, newRole, adminUserId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/teacher-applications")
    public ResponseEntity<List<TeacherApplicationResponse>> getApplications(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(teacherApplicationService.getApplications(status));
    }

    @PutMapping("/teacher-applications/{id}/approve")
    public ResponseEntity<?> approveApplication(@PathVariable String id, Authentication authentication) {
        try {
            String adminUserId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(teacherApplicationService.approveApplication(id, adminUserId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/teacher-applications/{id}/reject")
    public ResponseEntity<?> rejectApplication(@PathVariable String id, Authentication authentication) {
        try {
            String adminUserId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(teacherApplicationService.rejectApplication(id, adminUserId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
