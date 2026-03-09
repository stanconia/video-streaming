package com.videostreaming.course.dto;

import java.time.LocalDateTime;

public class LessonResponse {
    private String id;
    private String moduleId;
    private String courseId;
    private String title;
    private String content;
    private String type;
    private String videoUrl;
    private String fileUrl;
    private int orderIndex;
    private int estimatedMinutes;
    private LocalDateTime createdAt;

    public LessonResponse() {}

    public LessonResponse(String id, String moduleId, String courseId, String title,
                          String content, String type, String videoUrl, String fileUrl,
                          int orderIndex, int estimatedMinutes, LocalDateTime createdAt) {
        this.id = id;
        this.moduleId = moduleId;
        this.courseId = courseId;
        this.title = title;
        this.content = content;
        this.type = type;
        this.videoUrl = videoUrl;
        this.fileUrl = fileUrl;
        this.orderIndex = orderIndex;
        this.estimatedMinutes = estimatedMinutes;
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

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

    public int getEstimatedMinutes() { return estimatedMinutes; }
    public void setEstimatedMinutes(int estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
