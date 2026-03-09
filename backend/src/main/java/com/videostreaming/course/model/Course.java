package com.videostreaming.course.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String teacherUserId;

    @Column(nullable = false)
    private String title;

    @Column(length = 5000)
    private String description;

    @Column
    private String subject;

    @Column
    private BigDecimal price;

    @Column
    private String currency = "USD";

    @Column
    private String thumbnailUrl;

    @Column
    private String thumbnailKey;

    @Enumerated(EnumType.STRING)
    @Column
    private DifficultyLevel difficultyLevel;

    @Column
    private int estimatedHours;

    @Column
    private boolean published = false;

    @Column
    private String tags;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    public Course() {}

    public Course(String id, String teacherUserId, String title, String description, String subject,
                  BigDecimal price, String currency, String thumbnailUrl, String thumbnailKey,
                  DifficultyLevel difficultyLevel,
                  int estimatedHours, boolean published, String tags, LocalDateTime createdAt,
                  LocalDateTime updatedAt) {
        this.id = id;
        this.teacherUserId = teacherUserId;
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.price = price;
        this.currency = currency;
        this.thumbnailUrl = thumbnailUrl;
        this.thumbnailKey = thumbnailKey;
        this.difficultyLevel = difficultyLevel;
        this.estimatedHours = estimatedHours;
        this.published = published;
        this.tags = tags;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public String getThumbnailKey() { return thumbnailKey; }
    public void setThumbnailKey(String thumbnailKey) { this.thumbnailKey = thumbnailKey; }

    public DifficultyLevel getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(DifficultyLevel difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public int getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(int estimatedHours) { this.estimatedHours = estimatedHours; }

    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Builder pattern
    public static CourseBuilder builder() {
        return new CourseBuilder();
    }

    public static class CourseBuilder {
        private String id;
        private String teacherUserId;
        private String title;
        private String description;
        private String subject;
        private BigDecimal price;
        private String currency = "USD";
        private String thumbnailUrl;
        private String thumbnailKey;
        private DifficultyLevel difficultyLevel;
        private int estimatedHours;
        private boolean published = false;
        private String tags;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public CourseBuilder id(String id) { this.id = id; return this; }
        public CourseBuilder teacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; return this; }
        public CourseBuilder title(String title) { this.title = title; return this; }
        public CourseBuilder description(String description) { this.description = description; return this; }
        public CourseBuilder subject(String subject) { this.subject = subject; return this; }
        public CourseBuilder price(BigDecimal price) { this.price = price; return this; }
        public CourseBuilder currency(String currency) { this.currency = currency; return this; }
        public CourseBuilder thumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; return this; }
        public CourseBuilder thumbnailKey(String thumbnailKey) { this.thumbnailKey = thumbnailKey; return this; }
        public CourseBuilder difficultyLevel(DifficultyLevel difficultyLevel) { this.difficultyLevel = difficultyLevel; return this; }
        public CourseBuilder estimatedHours(int estimatedHours) { this.estimatedHours = estimatedHours; return this; }
        public CourseBuilder published(boolean published) { this.published = published; return this; }
        public CourseBuilder tags(String tags) { this.tags = tags; return this; }
        public CourseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public CourseBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Course build() {
            return new Course(id, teacherUserId, title, description, subject, price, currency,
                    thumbnailUrl, thumbnailKey, difficultyLevel, estimatedHours, published, tags, createdAt, updatedAt);
        }
    }
}
