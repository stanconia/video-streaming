package com.videostreaming.review.controller;

import com.videostreaming.review.dto.CreateReviewRequest;
import com.videostreaming.review.dto.ReviewResponse;
import com.videostreaming.review.dto.TeacherReplyRequest;
import com.videostreaming.review.service.ReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody CreateReviewRequest request,
                                           @RequestParam String teacherId,
                                           Authentication authentication) {
        try {
            String studentUserId = (String) authentication.getPrincipal();
            ReviewResponse response = reviewService.createReview(studentUserId, teacherId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> getReviews(@RequestParam String teacherId) {
        return ResponseEntity.ok(reviewService.getReviewsForTeacher(teacherId));
    }

    @PostMapping("/{reviewId}/reply")
    public ResponseEntity<?> replyToReview(@PathVariable String reviewId,
                                            @RequestBody TeacherReplyRequest request,
                                            Authentication authentication) {
        try {
            String teacherUserId = (String) authentication.getPrincipal();
            ReviewResponse response = reviewService.replyToReview(reviewId, teacherUserId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{reviewId}/helpful")
    public ResponseEntity<?> markHelpful(@PathVariable String reviewId, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            ReviewResponse response = reviewService.markHelpful(reviewId, userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
