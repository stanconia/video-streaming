package com.videostreaming.scheduling.dto;

public class ClassReminderResponse {
    private String classId;
    private String classTitle;
    private String scheduledAt;
    private int durationMinutes;

    public ClassReminderResponse() {}

    public ClassReminderResponse(String classId, String classTitle, String scheduledAt, int durationMinutes) {
        this.classId = classId;
        this.classTitle = classTitle;
        this.scheduledAt = scheduledAt;
        this.durationMinutes = durationMinutes;
    }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }
    public String getClassTitle() { return classTitle; }
    public void setClassTitle(String classTitle) { this.classTitle = classTitle; }
    public String getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(String scheduledAt) { this.scheduledAt = scheduledAt; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
}
