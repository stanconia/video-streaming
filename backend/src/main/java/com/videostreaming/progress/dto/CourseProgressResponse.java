package com.videostreaming.progress.dto;

import java.time.LocalDateTime;
import java.util.List;

public class CourseProgressResponse {

    private String courseId;
    private String courseTitle;
    private String enrollmentId;
    private int totalLessons;
    private int completedLessons;
    private double progressPercentage;
    private List<LessonProgressItem> lessons;
    private Double averageQuizScore;
    private LocalDateTime lastAccessedAt;

    public CourseProgressResponse() {}

    public CourseProgressResponse(String courseId, String courseTitle, String enrollmentId,
                                  int totalLessons, int completedLessons, double progressPercentage,
                                  List<LessonProgressItem> lessons, Double averageQuizScore,
                                  LocalDateTime lastAccessedAt) {
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.enrollmentId = enrollmentId;
        this.totalLessons = totalLessons;
        this.completedLessons = completedLessons;
        this.progressPercentage = progressPercentage;
        this.lessons = lessons;
        this.averageQuizScore = averageQuizScore;
        this.lastAccessedAt = lastAccessedAt;
    }

    // Getters and Setters
    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getEnrollmentId() { return enrollmentId; }
    public void setEnrollmentId(String enrollmentId) { this.enrollmentId = enrollmentId; }

    public int getTotalLessons() { return totalLessons; }
    public void setTotalLessons(int totalLessons) { this.totalLessons = totalLessons; }

    public int getCompletedLessons() { return completedLessons; }
    public void setCompletedLessons(int completedLessons) { this.completedLessons = completedLessons; }

    public double getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(double progressPercentage) { this.progressPercentage = progressPercentage; }

    public List<LessonProgressItem> getLessons() { return lessons; }
    public void setLessons(List<LessonProgressItem> lessons) { this.lessons = lessons; }

    public Double getAverageQuizScore() { return averageQuizScore; }
    public void setAverageQuizScore(Double averageQuizScore) { this.averageQuizScore = averageQuizScore; }

    public LocalDateTime getLastAccessedAt() { return lastAccessedAt; }
    public void setLastAccessedAt(LocalDateTime lastAccessedAt) { this.lastAccessedAt = lastAccessedAt; }

    public static class LessonProgressItem {
        private String lessonId;
        private String lessonTitle;
        private boolean completed;
        private LocalDateTime completedAt;

        public LessonProgressItem() {}

        public LessonProgressItem(String lessonId, String lessonTitle, boolean completed,
                                  LocalDateTime completedAt) {
            this.lessonId = lessonId;
            this.lessonTitle = lessonTitle;
            this.completed = completed;
            this.completedAt = completedAt;
        }

        public String getLessonId() { return lessonId; }
        public void setLessonId(String lessonId) { this.lessonId = lessonId; }

        public String getLessonTitle() { return lessonTitle; }
        public void setLessonTitle(String lessonTitle) { this.lessonTitle = lessonTitle; }

        public boolean isCompleted() { return completed; }
        public void setCompleted(boolean completed) { this.completed = completed; }

        public LocalDateTime getCompletedAt() { return completedAt; }
        public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    }
}
