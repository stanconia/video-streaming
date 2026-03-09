package com.videostreaming.course.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lessons")
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String moduleId;

    @Column(nullable = false)
    private String courseId;

    @Column(nullable = false)
    private String title;

    @Column(length = 10000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column
    private LessonType type;

    @Column
    private String fileKey;

    @Column
    private String videoUrl;

    @Column
    private int orderIndex;

    @Column
    private int estimatedMinutes;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Lesson() {}

    public Lesson(String id, String moduleId, String courseId, String title, String content,
                  LessonType type, String fileKey, String videoUrl, int orderIndex,
                  int estimatedMinutes, LocalDateTime createdAt) {
        this.id = id;
        this.moduleId = moduleId;
        this.courseId = courseId;
        this.title = title;
        this.content = content;
        this.type = type;
        this.fileKey = fileKey;
        this.videoUrl = videoUrl;
        this.orderIndex = orderIndex;
        this.estimatedMinutes = estimatedMinutes;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LessonType getType() { return type; }
    public void setType(LessonType type) { this.type = type; }

    public String getFileKey() { return fileKey; }
    public void setFileKey(String fileKey) { this.fileKey = fileKey; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

    public int getEstimatedMinutes() { return estimatedMinutes; }
    public void setEstimatedMinutes(int estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder pattern
    public static LessonBuilder builder() {
        return new LessonBuilder();
    }

    public static class LessonBuilder {
        private String id;
        private String moduleId;
        private String courseId;
        private String title;
        private String content;
        private LessonType type;
        private String fileKey;
        private String videoUrl;
        private int orderIndex;
        private int estimatedMinutes;
        private LocalDateTime createdAt;

        public LessonBuilder id(String id) { this.id = id; return this; }
        public LessonBuilder moduleId(String moduleId) { this.moduleId = moduleId; return this; }
        public LessonBuilder courseId(String courseId) { this.courseId = courseId; return this; }
        public LessonBuilder title(String title) { this.title = title; return this; }
        public LessonBuilder content(String content) { this.content = content; return this; }
        public LessonBuilder type(LessonType type) { this.type = type; return this; }
        public LessonBuilder fileKey(String fileKey) { this.fileKey = fileKey; return this; }
        public LessonBuilder videoUrl(String videoUrl) { this.videoUrl = videoUrl; return this; }
        public LessonBuilder orderIndex(int orderIndex) { this.orderIndex = orderIndex; return this; }
        public LessonBuilder estimatedMinutes(int estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; return this; }
        public LessonBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Lesson build() {
            return new Lesson(id, moduleId, courseId, title, content, type, fileKey, videoUrl,
                    orderIndex, estimatedMinutes, createdAt);
        }
    }
}
