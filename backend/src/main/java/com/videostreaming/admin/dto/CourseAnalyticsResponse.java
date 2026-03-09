package com.videostreaming.admin.dto;

import java.math.BigDecimal;

public class CourseAnalyticsResponse {
    private String courseId;
    private String courseTitle;
    private long totalEnrollments;
    private long activeEnrollments;
    private long completedEnrollments;
    private double completionRate;
    private double averageProgress;
    private Double averageQuizScore;
    private BigDecimal totalRevenue;

    public CourseAnalyticsResponse() {}

    public CourseAnalyticsResponse(String courseId, String courseTitle,
                                    long totalEnrollments, long activeEnrollments,
                                    long completedEnrollments, double completionRate,
                                    double averageProgress, Double averageQuizScore,
                                    BigDecimal totalRevenue) {
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.totalEnrollments = totalEnrollments;
        this.activeEnrollments = activeEnrollments;
        this.completedEnrollments = completedEnrollments;
        this.completionRate = completionRate;
        this.averageProgress = averageProgress;
        this.averageQuizScore = averageQuizScore;
        this.totalRevenue = totalRevenue;
    }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }
    public long getTotalEnrollments() { return totalEnrollments; }
    public void setTotalEnrollments(long totalEnrollments) { this.totalEnrollments = totalEnrollments; }
    public long getActiveEnrollments() { return activeEnrollments; }
    public void setActiveEnrollments(long activeEnrollments) { this.activeEnrollments = activeEnrollments; }
    public long getCompletedEnrollments() { return completedEnrollments; }
    public void setCompletedEnrollments(long completedEnrollments) { this.completedEnrollments = completedEnrollments; }
    public double getCompletionRate() { return completionRate; }
    public void setCompletionRate(double completionRate) { this.completionRate = completionRate; }
    public double getAverageProgress() { return averageProgress; }
    public void setAverageProgress(double averageProgress) { this.averageProgress = averageProgress; }
    public Double getAverageQuizScore() { return averageQuizScore; }
    public void setAverageQuizScore(Double averageQuizScore) { this.averageQuizScore = averageQuizScore; }
    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
}
