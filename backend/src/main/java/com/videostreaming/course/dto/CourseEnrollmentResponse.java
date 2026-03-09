package com.videostreaming.course.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CourseEnrollmentResponse {
    private String id;
    private String courseId;
    private String courseTitle;
    private String studentUserId;
    private String studentDisplayName;
    private String status;
    private BigDecimal paidAmount;
    private double progressPercentage;
    private LocalDateTime enrolledAt;
    private LocalDateTime completedAt;
    private String calendarLink;

    public CourseEnrollmentResponse() {}

    public CourseEnrollmentResponse(String id, String courseId, String courseTitle,
                                    String studentUserId, String studentDisplayName,
                                    String status, BigDecimal paidAmount,
                                    double progressPercentage, LocalDateTime enrolledAt,
                                    LocalDateTime completedAt) {
        this.id = id;
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.studentUserId = studentUserId;
        this.studentDisplayName = studentDisplayName;
        this.status = status;
        this.paidAmount = paidAmount;
        this.progressPercentage = progressPercentage;
        this.enrolledAt = enrolledAt;
        this.completedAt = completedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }

    public String getStudentDisplayName() { return studentDisplayName; }
    public void setStudentDisplayName(String studentDisplayName) { this.studentDisplayName = studentDisplayName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

    public double getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(double progressPercentage) { this.progressPercentage = progressPercentage; }

    public LocalDateTime getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(LocalDateTime enrolledAt) { this.enrolledAt = enrolledAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public String getCalendarLink() { return calendarLink; }
    public void setCalendarLink(String calendarLink) { this.calendarLink = calendarLink; }
}
