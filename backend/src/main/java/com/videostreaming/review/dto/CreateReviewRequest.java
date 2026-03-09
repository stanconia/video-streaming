package com.videostreaming.review.dto;

public class CreateReviewRequest {
    private String classId;
    private int rating;
    private String comment;

    public CreateReviewRequest() {}

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
