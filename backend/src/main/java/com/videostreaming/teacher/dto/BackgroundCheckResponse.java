package com.videostreaming.teacher.dto;

public class BackgroundCheckResponse {
    private String status;
    private String submittedAt;
    private String completedAt;

    public BackgroundCheckResponse() {}

    public BackgroundCheckResponse(String status, String submittedAt, String completedAt) {
        this.status = status;
        this.submittedAt = submittedAt;
        this.completedAt = completedAt;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }
    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }
}
