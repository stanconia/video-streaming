package com.videostreaming.course.controller;

import com.videostreaming.course.dto.CourseEnrollmentResponse;
import com.videostreaming.course.dto.CourseProgressResponse;
import com.videostreaming.course.service.CourseEnrollmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CourseEnrollmentController {

    private final CourseEnrollmentService courseEnrollmentService;

    public CourseEnrollmentController(CourseEnrollmentService courseEnrollmentService) {
        this.courseEnrollmentService = courseEnrollmentService;
    }

    @PostMapping("/courses/{courseId}/enrollments")
    public ResponseEntity<?> enroll(@PathVariable String courseId,
                                     @RequestBody Map<String, Object> body,
                                     Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            String paymentIntentId = (String) body.get("paymentIntentId");
            BigDecimal paidAmount = body.get("paidAmount") != null
                    ? new BigDecimal(body.get("paidAmount").toString()) : null;

            CourseEnrollmentResponse response = courseEnrollmentService.enroll(
                    courseId, userId, paymentIntentId, paidAmount);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/courses/{courseId}/enrollments/{enrollmentId}")
    public ResponseEntity<?> cancel(@PathVariable String courseId,
                                     @PathVariable String enrollmentId,
                                     Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            CourseEnrollmentResponse response = courseEnrollmentService.cancel(enrollmentId, userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/courses/{courseId}/enrollments")
    public ResponseEntity<List<CourseEnrollmentResponse>> getCourseEnrollments(
            @PathVariable String courseId) {
        return ResponseEntity.ok(courseEnrollmentService.getCourseEnrollments(courseId));
    }

    @GetMapping("/enrollments/me")
    public ResponseEntity<List<CourseEnrollmentResponse>> getMyEnrollments(
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(courseEnrollmentService.getMyEnrollments(userId));
    }

    @GetMapping("/courses/{courseId}/progress")
    public ResponseEntity<?> getCourseProgress(@PathVariable String courseId,
                                                Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            CourseProgressResponse response = courseEnrollmentService.getCourseProgress(courseId, userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/courses/{courseId}/lessons/{lessonId}/complete")
    public ResponseEntity<?> markLessonComplete(@PathVariable String courseId,
                                                 @PathVariable String lessonId,
                                                 Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            courseEnrollmentService.markLessonComplete(courseId, lessonId, userId);
            return ResponseEntity.ok(Map.of("message", "Lesson marked as complete"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/courses/{courseId}/lessons/{lessonId}/complete")
    public ResponseEntity<?> markLessonIncomplete(@PathVariable String courseId,
                                                   @PathVariable String lessonId,
                                                   Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            courseEnrollmentService.markLessonIncomplete(courseId, lessonId, userId);
            return ResponseEntity.ok(Map.of("message", "Lesson marked as incomplete"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
