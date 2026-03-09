package com.videostreaming.review.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String teacherUserId;

    @Column(nullable = false)
    private String studentUserId;

    @Column(nullable = false)
    private String classId;

    @Column(nullable = false)
    private int rating;

    @Column(length = 1000)
    private String comment;

    @Column(length = 1000)
    private String teacherReply;

    @Column
    private LocalDateTime teacherRepliedAt;

    @Column(nullable = false)
    private int helpfulCount;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Review() {}

    public Review(String id, String teacherUserId, String studentUserId, String classId,
                  int rating, String comment, String teacherReply, LocalDateTime teacherRepliedAt,
                  int helpfulCount, LocalDateTime createdAt) {
        this.id = id;
        this.teacherUserId = teacherUserId;
        this.studentUserId = studentUserId;
        this.classId = classId;
        this.rating = rating;
        this.comment = comment;
        this.teacherReply = teacherReply;
        this.teacherRepliedAt = teacherRepliedAt;
        this.helpfulCount = helpfulCount;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        helpfulCount = 0;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; }

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getTeacherReply() { return teacherReply; }
    public void setTeacherReply(String teacherReply) { this.teacherReply = teacherReply; }

    public LocalDateTime getTeacherRepliedAt() { return teacherRepliedAt; }
    public void setTeacherRepliedAt(LocalDateTime teacherRepliedAt) { this.teacherRepliedAt = teacherRepliedAt; }

    public int getHelpfulCount() { return helpfulCount; }
    public void setHelpfulCount(int helpfulCount) { this.helpfulCount = helpfulCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static ReviewBuilder builder() {
        return new ReviewBuilder();
    }

    public static class ReviewBuilder {
        private String id;
        private String teacherUserId;
        private String studentUserId;
        private String classId;
        private int rating;
        private String comment;
        private String teacherReply;
        private LocalDateTime teacherRepliedAt;
        private int helpfulCount;
        private LocalDateTime createdAt;

        public ReviewBuilder id(String id) { this.id = id; return this; }
        public ReviewBuilder teacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; return this; }
        public ReviewBuilder studentUserId(String studentUserId) { this.studentUserId = studentUserId; return this; }
        public ReviewBuilder classId(String classId) { this.classId = classId; return this; }
        public ReviewBuilder rating(int rating) { this.rating = rating; return this; }
        public ReviewBuilder comment(String comment) { this.comment = comment; return this; }
        public ReviewBuilder teacherReply(String teacherReply) { this.teacherReply = teacherReply; return this; }
        public ReviewBuilder teacherRepliedAt(LocalDateTime teacherRepliedAt) { this.teacherRepliedAt = teacherRepliedAt; return this; }
        public ReviewBuilder helpfulCount(int helpfulCount) { this.helpfulCount = helpfulCount; return this; }
        public ReviewBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Review build() {
            return new Review(id, teacherUserId, studentUserId, classId, rating, comment,
                    teacherReply, teacherRepliedAt, helpfulCount, createdAt);
        }
    }
}
