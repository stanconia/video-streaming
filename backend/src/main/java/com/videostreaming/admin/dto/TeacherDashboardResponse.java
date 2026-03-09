package com.videostreaming.admin.dto;

import java.math.BigDecimal;
import java.util.List;

public class TeacherDashboardResponse {
    private BigDecimal totalEarnings;
    private long totalStudents;
    private long totalClasses;
    private long upcomingClasses;
    private double averageRating;
    private long totalReviews;
    private List<MonthlyEarning> monthlyEarnings;
    private List<Object> upcomingClassList;

    public TeacherDashboardResponse() {}

    public BigDecimal getTotalEarnings() { return totalEarnings; }
    public void setTotalEarnings(BigDecimal totalEarnings) { this.totalEarnings = totalEarnings; }
    public long getTotalStudents() { return totalStudents; }
    public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }
    public long getTotalClasses() { return totalClasses; }
    public void setTotalClasses(long totalClasses) { this.totalClasses = totalClasses; }
    public long getUpcomingClasses() { return upcomingClasses; }
    public void setUpcomingClasses(long upcomingClasses) { this.upcomingClasses = upcomingClasses; }
    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
    public long getTotalReviews() { return totalReviews; }
    public void setTotalReviews(long totalReviews) { this.totalReviews = totalReviews; }
    public List<MonthlyEarning> getMonthlyEarnings() { return monthlyEarnings; }
    public void setMonthlyEarnings(List<MonthlyEarning> monthlyEarnings) { this.monthlyEarnings = monthlyEarnings; }
    public List<Object> getUpcomingClassList() { return upcomingClassList; }
    public void setUpcomingClassList(List<Object> upcomingClassList) { this.upcomingClassList = upcomingClassList; }

    public static class MonthlyEarning {
        private String month;
        private BigDecimal amount;

        public MonthlyEarning() {}

        public MonthlyEarning(String month, BigDecimal amount) {
            this.month = month;
            this.amount = amount;
        }

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }
}
