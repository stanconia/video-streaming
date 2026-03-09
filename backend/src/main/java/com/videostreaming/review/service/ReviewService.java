package com.videostreaming.review.service;

import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.teacher.service.TeacherProfileService;
import com.videostreaming.review.model.Review;
import com.videostreaming.review.model.ReviewHelpful;
import com.videostreaming.user.model.User;
import com.videostreaming.review.dto.CreateReviewRequest;
import com.videostreaming.review.dto.ReviewResponse;
import com.videostreaming.review.dto.TeacherReplyRequest;
import com.videostreaming.review.repository.ReviewHelpfulRepository;
import com.videostreaming.review.repository.ReviewRepository;
import com.videostreaming.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private static final Logger logger = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ReviewHelpfulRepository reviewHelpfulRepository;
    private final NotificationService notificationService;
    private final TeacherProfileService teacherProfileService;

    public ReviewService(ReviewRepository reviewRepository, UserRepository userRepository,
                         ReviewHelpfulRepository reviewHelpfulRepository,
                         NotificationService notificationService,
                         TeacherProfileService teacherProfileService) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.reviewHelpfulRepository = reviewHelpfulRepository;
        this.notificationService = notificationService;
        this.teacherProfileService = teacherProfileService;
    }

    @Transactional
    public ReviewResponse createReview(String studentUserId, String teacherUserId, CreateReviewRequest request) {
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        if (reviewRepository.existsByStudentUserIdAndClassId(studentUserId, request.getClassId())) {
            throw new RuntimeException("You have already reviewed this class");
        }

        Review review = Review.builder()
                .teacherUserId(teacherUserId)
                .studentUserId(studentUserId)
                .classId(request.getClassId())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        review = reviewRepository.save(review);
        logger.info("Review created by {} for teacher {}", studentUserId, teacherUserId);

        String studentName = userRepository.findById(studentUserId)
                .map(User::getDisplayName).orElse("A student");
        notificationService.sendReviewReceivedNotification(teacherUserId, studentName);

        // Refresh teacher profile rating stats
        teacherProfileService.refreshRatingStats(teacherUserId);

        return toResponse(review);
    }

    public List<ReviewResponse> getReviewsForTeacher(String teacherUserId) {
        return reviewRepository.findByTeacherUserIdOrderByCreatedAtDesc(teacherUserId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReviewResponse replyToReview(String reviewId, String teacherUserId, TeacherReplyRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        if (!review.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the reviewed teacher can reply");
        }

        if (request.getReply() == null || request.getReply().isBlank()) {
            throw new IllegalArgumentException("Reply cannot be empty");
        }

        review.setTeacherReply(request.getReply());
        review.setTeacherRepliedAt(LocalDateTime.now());
        review = reviewRepository.save(review);

        logger.info("Teacher {} replied to review {}", teacherUserId, reviewId);

        String teacherName = userRepository.findById(teacherUserId)
                .map(User::getDisplayName).orElse("Your teacher");
        notificationService.sendReviewReplyNotification(review.getStudentUserId(), teacherName);

        return toResponse(review);
    }

    @Transactional
    public ReviewResponse markHelpful(String reviewId, String userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        if (reviewHelpfulRepository.existsByReviewIdAndUserId(reviewId, userId)) {
            throw new RuntimeException("You have already marked this review as helpful");
        }

        ReviewHelpful helpful = new ReviewHelpful(null, reviewId, userId);
        reviewHelpfulRepository.save(helpful);

        review.setHelpfulCount(review.getHelpfulCount() + 1);
        review = reviewRepository.save(review);

        logger.info("User {} marked review {} as helpful", userId, reviewId);
        return toResponse(review);
    }

    private ReviewResponse toResponse(Review review) {
        String studentDisplayName = userRepository.findById(review.getStudentUserId())
                .map(User::getDisplayName)
                .orElse("Unknown");

        return new ReviewResponse(
                review.getId(),
                review.getTeacherUserId(),
                review.getStudentUserId(),
                studentDisplayName,
                review.getClassId(),
                review.getRating(),
                review.getComment(),
                review.getTeacherReply(),
                review.getTeacherRepliedAt(),
                review.getHelpfulCount(),
                review.getCreatedAt()
        );
    }
}
