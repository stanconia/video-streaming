package com.videostreaming.quiz.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quizzes")
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String moduleId;

    @Column(nullable = false)
    private String courseId;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    private int passPercentage = 70;

    private Integer timeLimitMinutes;

    private int orderIndex;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Quiz() {}

    public Quiz(String id, String moduleId, String courseId, String title, String description,
                int passPercentage, Integer timeLimitMinutes, int orderIndex, LocalDateTime createdAt) {
        this.id = id;
        this.moduleId = moduleId;
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.passPercentage = passPercentage;
        this.timeLimitMinutes = timeLimitMinutes;
        this.orderIndex = orderIndex;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (passPercentage == 0) {
            passPercentage = 70;
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getPassPercentage() { return passPercentage; }
    public void setPassPercentage(int passPercentage) { this.passPercentage = passPercentage; }

    public Integer getTimeLimitMinutes() { return timeLimitMinutes; }
    public void setTimeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static QuizBuilder builder() {
        return new QuizBuilder();
    }

    public static class QuizBuilder {
        private String id;
        private String moduleId;
        private String courseId;
        private String title;
        private String description;
        private int passPercentage = 70;
        private Integer timeLimitMinutes;
        private int orderIndex;
        private LocalDateTime createdAt;

        public QuizBuilder id(String id) { this.id = id; return this; }
        public QuizBuilder moduleId(String moduleId) { this.moduleId = moduleId; return this; }
        public QuizBuilder courseId(String courseId) { this.courseId = courseId; return this; }
        public QuizBuilder title(String title) { this.title = title; return this; }
        public QuizBuilder description(String description) { this.description = description; return this; }
        public QuizBuilder passPercentage(int passPercentage) { this.passPercentage = passPercentage; return this; }
        public QuizBuilder timeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; return this; }
        public QuizBuilder orderIndex(int orderIndex) { this.orderIndex = orderIndex; return this; }
        public QuizBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Quiz build() {
            return new Quiz(id, moduleId, courseId, title, description, passPercentage,
                    timeLimitMinutes, orderIndex, createdAt);
        }
    }
}
