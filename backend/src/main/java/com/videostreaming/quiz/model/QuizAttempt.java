package com.videostreaming.quiz.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String quizId;

    @Column(nullable = false)
    private String courseId;

    @Column(nullable = false)
    private String studentUserId;

    @Column(length = 5000)
    private String answers;

    private int score;

    private int totalPoints;

    private double percentage;

    private boolean passed;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    public QuizAttempt() {}

    public QuizAttempt(String id, String quizId, String courseId, String studentUserId, String answers,
                       int score, int totalPoints, double percentage, boolean passed,
                       LocalDateTime startedAt, LocalDateTime completedAt) {
        this.id = id;
        this.quizId = quizId;
        this.courseId = courseId;
        this.studentUserId = studentUserId;
        this.answers = answers;
        this.score = score;
        this.totalPoints = totalPoints;
        this.percentage = percentage;
        this.passed = passed;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
    }

    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getQuizId() { return quizId; }
    public void setQuizId(String quizId) { this.quizId = quizId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }

    public String getAnswers() { return answers; }
    public void setAnswers(String answers) { this.answers = answers; }

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

    public static QuizAttemptBuilder builder() {
        return new QuizAttemptBuilder();
    }

    public static class QuizAttemptBuilder {
        private String id;
        private String quizId;
        private String courseId;
        private String studentUserId;
        private String answers;
        private int score;
        private int totalPoints;
        private double percentage;
        private boolean passed;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;

        public QuizAttemptBuilder id(String id) { this.id = id; return this; }
        public QuizAttemptBuilder quizId(String quizId) { this.quizId = quizId; return this; }
        public QuizAttemptBuilder courseId(String courseId) { this.courseId = courseId; return this; }
        public QuizAttemptBuilder studentUserId(String studentUserId) { this.studentUserId = studentUserId; return this; }
        public QuizAttemptBuilder answers(String answers) { this.answers = answers; return this; }
        public QuizAttemptBuilder score(int score) { this.score = score; return this; }
        public QuizAttemptBuilder totalPoints(int totalPoints) { this.totalPoints = totalPoints; return this; }
        public QuizAttemptBuilder percentage(double percentage) { this.percentage = percentage; return this; }
        public QuizAttemptBuilder passed(boolean passed) { this.passed = passed; return this; }
        public QuizAttemptBuilder startedAt(LocalDateTime startedAt) { this.startedAt = startedAt; return this; }
        public QuizAttemptBuilder completedAt(LocalDateTime completedAt) { this.completedAt = completedAt; return this; }

        public QuizAttempt build() {
            return new QuizAttempt(id, quizId, courseId, studentUserId, answers, score,
                    totalPoints, percentage, passed, startedAt, completedAt);
        }
    }
}
