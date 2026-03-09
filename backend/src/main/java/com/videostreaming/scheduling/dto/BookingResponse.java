package com.videostreaming.scheduling.dto;

import java.time.LocalDateTime;

public class BookingResponse {
    private String id;
    private String classId;
    private String classTitle;
    private String studentUserId;
    private String status;
    private double paidAmount;
    private LocalDateTime createdAt;
    private LocalDateTime cancelledAt;

    public BookingResponse() {}

    public BookingResponse(String id, String classId, String classTitle, String studentUserId, String status, double paidAmount, LocalDateTime createdAt, LocalDateTime cancelledAt) {
        this.id = id;
        this.classId = classId;
        this.classTitle = classTitle;
        this.studentUserId = studentUserId;
        this.status = status;
        this.paidAmount = paidAmount;
        this.createdAt = createdAt;
        this.cancelledAt = cancelledAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }
    public String getClassTitle() { return classTitle; }
    public void setClassTitle(String classTitle) { this.classTitle = classTitle; }
    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public double getPaidAmount() { return paidAmount; }
    public void setPaidAmount(double paidAmount) { this.paidAmount = paidAmount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
}
