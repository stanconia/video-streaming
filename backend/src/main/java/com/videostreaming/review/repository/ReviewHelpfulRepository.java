package com.videostreaming.review.repository;

import com.videostreaming.review.model.ReviewHelpful;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewHelpfulRepository extends JpaRepository<ReviewHelpful, String> {
    boolean existsByReviewIdAndUserId(String reviewId, String userId);
}
