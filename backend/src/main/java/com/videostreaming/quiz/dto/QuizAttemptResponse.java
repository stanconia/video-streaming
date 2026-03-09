package com.videostreaming.quiz.dto;

import java.time.LocalDateTime;

public class QuizAttemptResponse {

    private String id;
    private String quizId;
    private String quizTitle;
    private String courseId;
    private String studentUserId;
    private int score;
    private int totalPoints;
    private double percentage;
    private boolean passed;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    public QuizAttemptResponse() {}

    public QuizAttemptResponse(String id, String quizId, String quizTitle, String courseId,
                               String studentUserId, int score, int totalPoints, double percentage,
                               boolean passed, LocalDateTime startedAt, LocalDateTime completedAt) {
        this.id = id;
        this.quizId = quizId;
        this.quizTitle = quizTitle;
        this.courseId = courseId;
        this.studentUserId = studentUserId;
        this.score = score;
        this.totalPoints = totalPoints;
        this.percentage = percentage;
        this.passed = passed;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getQuizId() { return quizId; }
    public void setQuizId(String quizId) { this.quizId = quizId; }

    public String getQuizTitle() { return quizTitle; }
    public void setQuizTitle(String quizTitle) { this.quizTitle = quizTitle; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }

    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
