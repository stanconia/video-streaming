package com.videostreaming.assignment.controller;

import com.videostreaming.assignment.dto.AssignmentResponse;
import com.videostreaming.assignment.dto.AssignmentSubmissionResponse;
import com.videostreaming.assignment.dto.CreateAssignmentRequest;
import com.videostreaming.assignment.service.AssignmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses/{courseId}")
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping("/modules/{moduleId}/assignments")
    public ResponseEntity<?> createAssignment(@PathVariable String courseId,
                                               @PathVariable String moduleId,
                                               @RequestBody CreateAssignmentRequest request,
                                               Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            AssignmentResponse response = assignmentService.createAssignment(courseId, moduleId, userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/assignments/{assignmentId}")
    public ResponseEntity<?> updateAssignment(@PathVariable String courseId,
                                               @PathVariable String assignmentId,
                                               @RequestBody CreateAssignmentRequest request,
                                               Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            AssignmentResponse response = assignmentService.updateAssignment(assignmentId, userId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/assignments/{assignmentId}")
    public ResponseEntity<?> deleteAssignment(@PathVariable String courseId,
                                               @PathVariable String assignmentId,
                                               Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            assignmentService.deleteAssignment(assignmentId, userId);
            return ResponseEntity.ok(Map.of("message", "Assignment deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/modules/{moduleId}/assignments")
    public ResponseEntity<List<AssignmentResponse>> getAssignmentsForModule(
            @PathVariable String courseId,
            @PathVariable String moduleId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsForModule(moduleId));
    }

    @PostMapping("/assignments/{assignmentId}/submit")
    public ResponseEntity<?> submitAssignment(@PathVariable String courseId,
                                               @PathVariable String assignmentId,
                                               @RequestBody Map<String, String> body,
                                               Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            String content = body.get("content");
            String fileKey = body.get("fileKey");
            String fileName = body.get("fileName");
            AssignmentSubmissionResponse response = assignmentService.submitAssignment(
                    assignmentId, userId, content, fileKey, fileName);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/submissions/{submissionId}/grade")
    public ResponseEntity<?> gradeSubmission(@PathVariable String courseId,
                                              @PathVariable String submissionId,
                                              @RequestBody Map<String, Object> body,
                                              Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            Integer score = body.get("score") != null ? ((Number) body.get("score")).intValue() : null;
            String feedback = (String) body.get("feedback");
            AssignmentSubmissionResponse response = assignmentService.gradeSubmission(
                    submissionId, userId, score, feedback);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/assignments/{assignmentId}/submissions")
    public ResponseEntity<List<AssignmentSubmissionResponse>> getSubmissions(
            @PathVariable String courseId,
            @PathVariable String assignmentId) {
        return ResponseEntity.ok(assignmentService.getSubmissions(assignmentId));
    }

    @GetMapping("/assignments/{assignmentId}/my-submission")
    public ResponseEntity<?> getMySubmission(@PathVariable String courseId,
                                              @PathVariable String assignmentId,
                                              Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            AssignmentSubmissionResponse response = assignmentService.getMySubmission(assignmentId, userId);
            if (response == null) {
                return ResponseEntity.ok(Map.of("message", "No submission found"));
            }
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
