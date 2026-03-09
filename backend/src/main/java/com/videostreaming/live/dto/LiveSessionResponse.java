package com.videostreaming.live.dto;

import java.time.LocalDateTime;

public class LiveSessionResponse {
    private String id;
    private String courseId;
    private String courseTitle;
    private boolean coursePublished;
    private String moduleId;
    private String moduleTitle;
    private String teacherUserId;
    private String teacherDisplayName;
    private String title;
    private String description;
    private LocalDateTime scheduledAt;
    private int durationMinutes;
    private String status;
    private String roomId;
    private LocalDateTime createdAt;

    public LiveSessionResponse() {}

    public LiveSessionResponse(String id, String courseId, String courseTitle, boolean coursePublished, String moduleId, String moduleTitle, String teacherUserId, String teacherDisplayName, String title, String description, LocalDateTime scheduledAt, int durationMinutes, String status, String roomId, LocalDateTime createdAt) {
        this.id = id;
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.coursePublished = coursePublished;
        this.moduleId = moduleId;
        this.moduleTitle = moduleTitle;
        this.teacherUserId = teacherUserId;
        this.teacherDisplayName = teacherDisplayName;
        this.title = title;
        this.description = description;
        this.scheduledAt = scheduledAt;
        this.durationMinutes = durationMinutes;
        this.status = status;
        this.roomId = roomId;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }
    public boolean isCoursePublished() { return coursePublished; }
    public void setCoursePublished(boolean coursePublished) { this.coursePublished = coursePublished; }
    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }
    public String getModuleTitle() { return moduleTitle; }
    public void setModuleTitle(String moduleTitle) { this.moduleTitle = moduleTitle; }
    public String getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; }
    public String getTeacherDisplayName() { return teacherDisplayName; }
    public void setTeacherDisplayName(String teacherDisplayName) { this.teacherDisplayName = teacherDisplayName; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
