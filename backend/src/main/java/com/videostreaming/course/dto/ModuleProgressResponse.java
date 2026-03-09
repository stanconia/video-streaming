package com.videostreaming.course.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ModuleProgressResponse {
    private String moduleId;
    private String moduleTitle;
    private int totalLessons;
    private int completedLessons;
    private double progressPercentage;
    private List<LessonProgressItem> lessons;

    public ModuleProgressResponse() {}

    public ModuleProgressResponse(String moduleId, String moduleTitle, int totalLessons,
                                  int completedLessons, double progressPercentage,
                                  List<LessonProgressItem> lessons) {
        this.moduleId = moduleId;
        this.moduleTitle = moduleTitle;
        this.totalLessons = totalLessons;
        this.completedLessons = completedLessons;
        this.progressPercentage = progressPercentage;
        this.lessons = lessons;
    }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public String getModuleTitle() { return moduleTitle; }
    public void setModuleTitle(String moduleTitle) { this.moduleTitle = moduleTitle; }

    public int getTotalLessons() { return totalLessons; }
    public void setTotalLessons(int totalLessons) { this.totalLessons = totalLessons; }

    public int getCompletedLessons() { return completedLessons; }
    public void setCompletedLessons(int completedLessons) { this.completedLessons = completedLessons; }

    public double getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(double progressPercentage) { this.progressPercentage = progressPercentage; }

    public List<LessonProgressItem> getLessons() { return lessons; }
    public void setLessons(List<LessonProgressItem> lessons) { this.lessons = lessons; }

    public static class LessonProgressItem {
        private String lessonId;
        private String title;
        private boolean completed;
        private LocalDateTime completedAt;

        public LessonProgressItem() {}

        public LessonProgressItem(String lessonId, String title, boolean completed,
                                  LocalDateTime completedAt) {
            this.lessonId = lessonId;
            this.title = title;
            this.completed = completed;
            this.completedAt = completedAt;
        }

        public String getLessonId() { return lessonId; }
        public void setLessonId(String lessonId) { this.lessonId = lessonId; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public boolean isCompleted() { return completed; }
        public void setCompleted(boolean completed) { this.completed = completed; }

        public LocalDateTime getCompletedAt() { return completedAt; }
        public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    }
}
