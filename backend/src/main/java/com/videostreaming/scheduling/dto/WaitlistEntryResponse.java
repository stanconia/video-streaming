package com.videostreaming.scheduling.dto;

import java.time.LocalDateTime;

public class WaitlistEntryResponse {
    private String id;
    private String classId;
    private String studentUserId;
    private String studentDisplayName;
    private int position;
    private LocalDateTime createdAt;

    public WaitlistEntryResponse() {}

    public WaitlistEntryResponse(String id, String classId, String studentUserId, String studentDisplayName, int position, LocalDateTime createdAt) {
        this.id = id;
        this.classId = classId;
        this.studentUserId = studentUserId;
        this.studentDisplayName = studentDisplayName;
        this.position = position;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }
    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }
    public String getStudentDisplayName() { return studentDisplayName; }
    public void setStudentDisplayName(String studentDisplayName) { this.studentDisplayName = studentDisplayName; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
