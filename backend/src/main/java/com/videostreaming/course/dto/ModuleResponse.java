package com.videostreaming.course.dto;

import java.time.LocalDateTime;

public class ModuleResponse {
    private String id;
    private String courseId;
    private String title;
    private String description;
    private int orderIndex;
    private int lessonCount;
    private String thumbnailUrl;
    private LocalDateTime createdAt;

    public ModuleResponse() {}

    public ModuleResponse(String id, String courseId, String title, String description,
                          int orderIndex, int lessonCount, String thumbnailUrl, LocalDateTime createdAt) {
        this.id = id;
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.orderIndex = orderIndex;
        this.lessonCount = lessonCount;
        this.thumbnailUrl = thumbnailUrl;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

    public int getLessonCount() { return lessonCount; }
    public void setLessonCount(int lessonCount) { this.lessonCount = lessonCount; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
