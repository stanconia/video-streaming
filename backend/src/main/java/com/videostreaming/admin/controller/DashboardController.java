package com.videostreaming.admin.controller;

import com.videostreaming.admin.dto.CourseAnalyticsResponse;
import com.videostreaming.admin.dto.StudentDashboardResponse;
import com.videostreaming.admin.dto.StudentPerformanceResponse;
import com.videostreaming.admin.dto.TeacherDashboardResponse;
import com.videostreaming.admin.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/teacher")
    public ResponseEntity<TeacherDashboardResponse> getTeacherDashboard(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(dashboardService.getTeacherDashboard(userId));
    }

    @GetMapping("/student")
    public ResponseEntity<StudentDashboardResponse> getStudentDashboard(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(dashboardService.getStudentDashboard(userId));
    }

    @GetMapping("/courses/{courseId}/analytics")
    public ResponseEntity<?> getCourseAnalytics(@PathVariable String courseId,
                                                 Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(dashboardService.getCourseAnalytics(courseId, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/courses/{courseId}/students")
    public ResponseEntity<?> getCourseStudents(@PathVariable String courseId,
                                                Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(dashboardService.getCourseStudents(courseId, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
