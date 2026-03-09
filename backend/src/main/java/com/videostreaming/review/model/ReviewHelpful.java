package com.videostreaming.review.model;

import jakarta.persistence.*;

@Entity
@Table(name = "review_helpfuls", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"reviewId", "userId"})
})
public class ReviewHelpful {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String reviewId;

    @Column(nullable = false)
    private String userId;

    public ReviewHelpful() {}

    public ReviewHelpful(String id, String reviewId, String userId) {
        this.id = id;
        this.reviewId = reviewId;
        this.userId = userId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getReviewId() { return reviewId; }
    public void setReviewId(String reviewId) { this.reviewId = reviewId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
