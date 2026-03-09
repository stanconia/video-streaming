package com.videostreaming.live.dto;

public class CreateLiveSessionRequest {
    private String courseId;
    private String moduleId;
    private String title;
    private String description;
    private String scheduledAt;
    private int durationMinutes;

    public CreateLiveSessionRequest() {}

    public CreateLiveSessionRequest(String courseId, String moduleId, String title, String description, String scheduledAt, int durationMinutes) {
        this.courseId = courseId;
        this.moduleId = moduleId;
        this.title = title;
        this.description = description;
        this.scheduledAt = scheduledAt;
        this.durationMinutes = durationMinutes;
    }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(String scheduledAt) { this.scheduledAt = scheduledAt; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
}
