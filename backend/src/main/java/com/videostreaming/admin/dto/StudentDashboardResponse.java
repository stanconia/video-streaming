package com.videostreaming.admin.dto;

import com.videostreaming.course.dto.CourseEnrollmentResponse;
import java.math.BigDecimal;
import java.util.List;

public class StudentDashboardResponse {
    private long totalEnrollments;
    private long activeEnrollments;
    private long completedCourses;
    private BigDecimal totalSpent;
    private List<CourseEnrollmentResponse> recentEnrollments;

    public StudentDashboardResponse() {}

    public long getTotalEnrollments() { return totalEnrollments; }
    public void setTotalEnrollments(long totalEnrollments) { this.totalEnrollments = totalEnrollments; }
    public long getActiveEnrollments() { return activeEnrollments; }
    public void setActiveEnrollments(long activeEnrollments) { this.activeEnrollments = activeEnrollments; }
    public long getCompletedCourses() { return completedCourses; }
    public void setCompletedCourses(long completedCourses) { this.completedCourses = completedCourses; }
    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }
    public List<CourseEnrollmentResponse> getRecentEnrollments() { return recentEnrollments; }
    public void setRecentEnrollments(List<CourseEnrollmentResponse> recentEnrollments) { this.recentEnrollments = recentEnrollments; }
}
