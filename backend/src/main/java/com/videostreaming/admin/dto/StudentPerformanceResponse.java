package com.videostreaming.admin.dto;

import java.math.BigDecimal;
import java.util.List;

public class StudentPerformanceResponse {
    private String studentUserId;
    private String studentDisplayName;
    private double progressPercentage;
    private String enrollmentStatus;
    private BigDecimal paidAmount;
    private Double averageQuizScore;
    private Double averageAssignmentScore;
    private List<QuizAttemptSummary> quizAttempts;
    private List<AssignmentGradeSummary> assignmentGrades;

    public StudentPerformanceResponse() {}

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }
    public String getStudentDisplayName() { return studentDisplayName; }
    public void setStudentDisplayName(String studentDisplayName) { this.studentDisplayName = studentDisplayName; }
    public double getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(double progressPercentage) { this.progressPercentage = progressPercentage; }
    public String getEnrollmentStatus() { return enrollmentStatus; }
    public void setEnrollmentStatus(String enrollmentStatus) { this.enrollmentStatus = enrollmentStatus; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
    public Double getAverageQuizScore() { return averageQuizScore; }
    public void setAverageQuizScore(Double averageQuizScore) { this.averageQuizScore = averageQuizScore; }
    public Double getAverageAssignmentScore() { return averageAssignmentScore; }
    public void setAverageAssignmentScore(Double averageAssignmentScore) { this.averageAssignmentScore = averageAssignmentScore; }
    public List<QuizAttemptSummary> getQuizAttempts() { return quizAttempts; }
    public void setQuizAttempts(List<QuizAttemptSummary> quizAttempts) { this.quizAttempts = quizAttempts; }
    public List<AssignmentGradeSummary> getAssignmentGrades() { return assignmentGrades; }
    public void setAssignmentGrades(List<AssignmentGradeSummary> assignmentGrades) { this.assignmentGrades = assignmentGrades; }

    public static class QuizAttemptSummary {
        private String quizId;
        private String quizTitle;
        private double percentage;
        private boolean passed;

        public QuizAttemptSummary() {}

        public QuizAttemptSummary(String quizId, String quizTitle, double percentage, boolean passed) {
            this.quizId = quizId;
            this.quizTitle = quizTitle;
            this.percentage = percentage;
            this.passed = passed;
        }

        public String getQuizId() { return quizId; }
        public void setQuizId(String quizId) { this.quizId = quizId; }
        public String getQuizTitle() { return quizTitle; }
        public void setQuizTitle(String quizTitle) { this.quizTitle = quizTitle; }
        public double getPercentage() { return percentage; }
        public void setPercentage(double percentage) { this.percentage = percentage; }
        public boolean isPassed() { return passed; }
        public void setPassed(boolean passed) { this.passed = passed; }
    }

    public static class AssignmentGradeSummary {
        private String assignmentId;
        private String assignmentTitle;
        private Integer score;
        private int maxScore;

        public AssignmentGradeSummary() {}

        public AssignmentGradeSummary(String assignmentId, String assignmentTitle, Integer score, int maxScore) {
            this.assignmentId = assignmentId;
            this.assignmentTitle = assignmentTitle;
            this.score = score;
            this.maxScore = maxScore;
        }

        public String getAssignmentId() { return assignmentId; }
        public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }
        public String getAssignmentTitle() { return assignmentTitle; }
        public void setAssignmentTitle(String assignmentTitle) { this.assignmentTitle = assignmentTitle; }
        public Integer getScore() { return score; }
        public void setScore(Integer score) { this.score = score; }
        public int getMaxScore() { return maxScore; }
        public void setMaxScore(int maxScore) { this.maxScore = maxScore; }
    }
}
