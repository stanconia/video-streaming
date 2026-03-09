package com.videostreaming.assignment.dto;

import java.time.LocalDateTime;

public class AssignmentResponse {

    private String id;
    private String moduleId;
    private String courseId;
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private int maxScore;
    private int orderIndex;
    private int submissionCount;
    private LocalDateTime createdAt;

    public AssignmentResponse() {}

    public AssignmentResponse(String id, String moduleId, String courseId, String title,
                              String description, LocalDateTime dueDate, int maxScore,
                              int orderIndex, int submissionCount, LocalDateTime createdAt) {
        this.id = id;
        this.moduleId = moduleId;
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.maxScore = maxScore;
        this.orderIndex = orderIndex;
        this.submissionCount = submissionCount;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public int getMaxScore() { return maxScore; }
    public void setMaxScore(int maxScore) { this.maxScore = maxScore; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

    public int getSubmissionCount() { return submissionCount; }
    public void setSubmissionCount(int submissionCount) { this.submissionCount = submissionCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
