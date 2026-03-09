package com.videostreaming.review.service;

import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.review.dto.CreateReviewRequest;
import com.videostreaming.review.dto.ReviewResponse;
import com.videostreaming.review.model.Review;
import com.videostreaming.review.model.ReviewHelpful;
import com.videostreaming.review.repository.ReviewHelpfulRepository;
import com.videostreaming.review.repository.ReviewRepository;
import com.videostreaming.teacher.service.TeacherProfileService;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import com.videostreaming.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private UserRepository userRepository;
    @Mock private ReviewHelpfulRepository reviewHelpfulRepository;
    @Mock private NotificationService notificationService;
    @Mock private TeacherProfileService teacherProfileService;

    @InjectMocks private ReviewService service;

    @Test
    void createReview_success() {
        String studentUserId = "student-1";
        String teacherUserId = "teacher-1";

        CreateReviewRequest request = new CreateReviewRequest();
        request.setClassId("class-1");
        request.setRating(5);
        request.setComment("Excellent class!");

        Review savedReview = Review.builder()
                .id("review-1")
                .teacherUserId(teacherUserId)
                .studentUserId(studentUserId)
                .classId("class-1")
                .rating(5)
                .comment("Excellent class!")
                .helpfulCount(0)
                .createdAt(LocalDateTime.now())
                .build();

        User student = User.builder()
                .id(studentUserId)
                .displayName("Jane Student")
                .email("jane@test.com")
                .role(UserRole.STUDENT)
                .build();

        when(reviewRepository.existsByStudentUserIdAndClassId(studentUserId, "class-1")).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);
        when(userRepository.findById(studentUserId)).thenReturn(Optional.of(student));

        ReviewResponse result = service.createReview(studentUserId, teacherUserId, request);

        assertNotNull(result);
        assertEquals("review-1", result.getId());
        assertEquals(5, result.getRating());
        assertEquals("Excellent class!", result.getComment());
        verify(notificationService).sendReviewReceivedNotification(eq(teacherUserId), eq("Jane Student"));
        verify(teacherProfileService).refreshRatingStats(teacherUserId);
    }

    @Test
    void getReviewsForTeacher_returnsList() {
        String teacherUserId = "teacher-1";

        Review r1 = Review.builder()
                .id("review-1")
                .teacherUserId(teacherUserId)
                .studentUserId("student-1")
                .classId("class-1")
                .rating(5)
                .comment("Great!")
                .helpfulCount(2)
                .createdAt(LocalDateTime.now())
                .build();

        Review r2 = Review.builder()
                .id("review-2")
                .teacherUserId(teacherUserId)
                .studentUserId("student-2")
                .classId("class-2")
                .rating(4)
                .comment("Good")
                .helpfulCount(0)
                .createdAt(LocalDateTime.now())
                .build();

        User student1 = User.builder()
                .id("student-1")
                .displayName("Student 1")
                .email("s1@test.com")
                .role(UserRole.STUDENT)
                .build();

        User student2 = User.builder()
                .id("student-2")
                .displayName("Student 2")
                .email("s2@test.com")
                .role(UserRole.STUDENT)
                .build();

        when(reviewRepository.findByTeacherUserIdOrderByCreatedAtDesc(teacherUserId))
                .thenReturn(List.of(r1, r2));
        when(userRepository.findById("student-1")).thenReturn(Optional.of(student1));
        when(userRepository.findById("student-2")).thenReturn(Optional.of(student2));

        List<ReviewResponse> result = service.getReviewsForTeacher(teacherUserId);

        assertEquals(2, result.size());
        assertEquals(5, result.get(0).getRating());
        assertEquals(4, result.get(1).getRating());
        assertEquals("Student 1", result.get(0).getStudentDisplayName());
        assertEquals("Student 2", result.get(1).getStudentDisplayName());
    }

    @Test
    void markHelpful_success() {
        String reviewId = "review-1";
        String userId = "user-1";

        Review review = Review.builder()
                .id(reviewId)
                .teacherUserId("teacher-1")
                .studentUserId("student-1")
                .classId("class-1")
                .rating(5)
                .comment("Great!")
                .helpfulCount(3)
                .createdAt(LocalDateTime.now())
                .build();

        Review updatedReview = Review.builder()
                .id(reviewId)
                .teacherUserId("teacher-1")
                .studentUserId("student-1")
                .classId("class-1")
                .rating(5)
                .comment("Great!")
                .helpfulCount(4)
                .createdAt(LocalDateTime.now())
                .build();

        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
        when(reviewHelpfulRepository.existsByReviewIdAndUserId(reviewId, userId)).thenReturn(false);
        when(reviewHelpfulRepository.save(any(ReviewHelpful.class))).thenReturn(new ReviewHelpful("h1", reviewId, userId));
        when(reviewRepository.save(any(Review.class))).thenReturn(updatedReview);
        when(userRepository.findById("student-1")).thenReturn(Optional.empty());

        ReviewResponse result = service.markHelpful(reviewId, userId);

        assertNotNull(result);
        assertEquals(4, result.getHelpfulCount());
        verify(reviewHelpfulRepository).save(any(ReviewHelpful.class));
    }

    @Test
    void createReview_invalidRating_throws() {
        String studentUserId = "student-1";
        String teacherUserId = "teacher-1";

        CreateReviewRequest request = new CreateReviewRequest();
        request.setClassId("class-1");
        request.setRating(6); // Invalid: must be 1-5
        request.setComment("Too high rating");

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                service.createReview(studentUserId, teacherUserId, request));

        assertTrue(exception.getMessage().contains("Rating must be between 1 and 5"));
    }
}
