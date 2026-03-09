package com.videostreaming.admin.dto;

import java.math.BigDecimal;

public class AdminStatsResponse {
    private long totalUsers;
    private long totalTeachers;
    private long totalStudents;
    private long totalCourses;
    private long totalEnrollments;
    private BigDecimal totalRevenue;
    private long pendingApplications;

    public AdminStatsResponse() {}

    public AdminStatsResponse(long totalUsers, long totalTeachers, long totalStudents,
                               long totalCourses, long totalEnrollments, BigDecimal totalRevenue,
                               long pendingApplications) {
        this.totalUsers = totalUsers;
        this.totalTeachers = totalTeachers;
        this.totalStudents = totalStudents;
        this.totalCourses = totalCourses;
        this.totalEnrollments = totalEnrollments;
        this.totalRevenue = totalRevenue;
        this.pendingApplications = pendingApplications;
    }

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public long getTotalTeachers() { return totalTeachers; }
    public void setTotalTeachers(long totalTeachers) { this.totalTeachers = totalTeachers; }
    public long getTotalStudents() { return totalStudents; }
    public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }
    public long getTotalCourses() { return totalCourses; }
    public void setTotalCourses(long totalCourses) { this.totalCourses = totalCourses; }
    public long getTotalEnrollments() { return totalEnrollments; }
    public void setTotalEnrollments(long totalEnrollments) { this.totalEnrollments = totalEnrollments; }
    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
    public long getPendingApplications() { return pendingApplications; }
    public void setPendingApplications(long pendingApplications) { this.pendingApplications = pendingApplications; }
}
