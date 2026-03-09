package com.videostreaming.course.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "course_modules")
public class CourseModule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String courseId;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column
    private int orderIndex;

    @Column
    private String thumbnailKey;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public CourseModule() {}

    public CourseModule(String id, String courseId, String title, String description, int orderIndex,
                        String thumbnailKey, LocalDateTime createdAt) {
        this.id = id;
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.orderIndex = orderIndex;
        this.thumbnailKey = thumbnailKey;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

    public String getThumbnailKey() { return thumbnailKey; }
    public void setThumbnailKey(String thumbnailKey) { this.thumbnailKey = thumbnailKey; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder pattern
    public static CourseModuleBuilder builder() {
        return new CourseModuleBuilder();
    }

    public static class CourseModuleBuilder {
        private String id;
        private String courseId;
        private String title;
        private String description;
        private int orderIndex;
        private String thumbnailKey;
        private LocalDateTime createdAt;

        public CourseModuleBuilder id(String id) { this.id = id; return this; }
        public CourseModuleBuilder courseId(String courseId) { this.courseId = courseId; return this; }
        public CourseModuleBuilder title(String title) { this.title = title; return this; }
        public CourseModuleBuilder description(String description) { this.description = description; return this; }
        public CourseModuleBuilder orderIndex(int orderIndex) { this.orderIndex = orderIndex; return this; }
        public CourseModuleBuilder thumbnailKey(String thumbnailKey) { this.thumbnailKey = thumbnailKey; return this; }
        public CourseModuleBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public CourseModule build() {
            return new CourseModule(id, courseId, title, description, orderIndex, thumbnailKey, createdAt);
        }
    }
}
