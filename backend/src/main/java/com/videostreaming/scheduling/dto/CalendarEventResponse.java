package com.videostreaming.scheduling.dto;

public class CalendarEventResponse {
    private String id;
    private String title;
    private String date;
    private String time;
    private int durationMinutes;
    private String type;
    private String status;
    private String classId;
    private String moduleTitle;

    public CalendarEventResponse() {}

    public CalendarEventResponse(String id, String title, String date, String time, int durationMinutes, String type, String status, String classId) {
        this.id = id;
        this.title = title;
        this.date = date;
        this.time = time;
        this.durationMinutes = durationMinutes;
        this.type = type;
        this.status = status;
        this.classId = classId;
    }

    public CalendarEventResponse(String id, String title, String date, String time, int durationMinutes, String type, String status, String classId, String moduleTitle) {
        this(id, title, date, time, durationMinutes, type, status, classId);
        this.moduleTitle = moduleTitle;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }
    public String getModuleTitle() { return moduleTitle; }
    public void setModuleTitle(String moduleTitle) { this.moduleTitle = moduleTitle; }
}
