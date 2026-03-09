package com.videostreaming.review.dto;

import java.time.LocalDateTime;

public class ReviewResponse {
    private String id;
    private String teacherUserId;
    private String studentUserId;
    private String studentDisplayName;
    private String classId;
    private int rating;
    private String comment;
    private String teacherReply;
    private LocalDateTime teacherRepliedAt;
    private int helpfulCount;
    private LocalDateTime createdAt;

    public ReviewResponse() {}

    public ReviewResponse(String id, String teacherUserId, String studentUserId,
                          String studentDisplayName, String classId, int rating,
                          String comment, String teacherReply, LocalDateTime teacherRepliedAt,
                          int helpfulCount, LocalDateTime createdAt) {
        this.id = id;
        this.teacherUserId = teacherUserId;
        this.studentUserId = studentUserId;
        this.studentDisplayName = studentDisplayName;
        this.classId = classId;
        this.rating = rating;
        this.comment = comment;
        this.teacherReply = teacherReply;
        this.teacherRepliedAt = teacherRepliedAt;
        this.helpfulCount = helpfulCount;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; }

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }

    public String getStudentDisplayName() { return studentDisplayName; }
    public void setStudentDisplayName(String studentDisplayName) { this.studentDisplayName = studentDisplayName; }

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
}
