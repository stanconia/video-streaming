package com.videostreaming.course.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CourseResponse {
    private String id;
    private String teacherUserId;
    private String teacherDisplayName;
    private String teacherHeadline;
    private String teacherProfileImageUrl;
    private Double teacherAverageRating;
    private String title;
    private String description;
    private String subject;
    private BigDecimal price;
    private String currency;
    private String thumbnailUrl;
    private String difficultyLevel;
    private int estimatedHours;
    private boolean published;
    private Integer minAge;
    private Integer maxAge;
    private String tags;
    private int moduleCount;
    private int lessonCount;
    private int enrolledCount;
    private Double averageRating;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CourseResponse() {}

    public CourseResponse(String id, String teacherUserId, String teacherDisplayName,
                          String teacherHeadline, String teacherProfileImageUrl, Double teacherAverageRating,
                          String title, String description, String subject, BigDecimal price, String currency,
                          String thumbnailUrl, String difficultyLevel, int estimatedHours,
                          boolean published, Integer minAge, Integer maxAge,
                          String tags, int moduleCount, int lessonCount,
                          int enrolledCount, Double averageRating,
                          LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.teacherUserId = teacherUserId;
        this.teacherDisplayName = teacherDisplayName;
        this.teacherHeadline = teacherHeadline;
        this.teacherProfileImageUrl = teacherProfileImageUrl;
        this.teacherAverageRating = teacherAverageRating;
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.price = price;
        this.currency = currency;
        this.thumbnailUrl = thumbnailUrl;
        this.difficultyLevel = difficultyLevel;
        this.estimatedHours = estimatedHours;
        this.published = published;
        this.minAge = minAge;
        this.maxAge = maxAge;
        this.tags = tags;
        this.moduleCount = moduleCount;
        this.lessonCount = lessonCount;
        this.enrolledCount = enrolledCount;
        this.averageRating = averageRating;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; }

    public String getTeacherDisplayName() { return teacherDisplayName; }
    public void setTeacherDisplayName(String teacherDisplayName) { this.teacherDisplayName = teacherDisplayName; }

    public String getTeacherHeadline() { return teacherHeadline; }
    public void setTeacherHeadline(String teacherHeadline) { this.teacherHeadline = teacherHeadline; }

    public String getTeacherProfileImageUrl() { return teacherProfileImageUrl; }
    public void setTeacherProfileImageUrl(String teacherProfileImageUrl) { this.teacherProfileImageUrl = teacherProfileImageUrl; }

    public Double getTeacherAverageRating() { return teacherAverageRating; }
    public void setTeacherAverageRating(Double teacherAverageRating) { this.teacherAverageRating = teacherAverageRating; }

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

    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public int getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(int estimatedHours) { this.estimatedHours = estimatedHours; }

    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }

    public Integer getMinAge() { return minAge; }
    public void setMinAge(Integer minAge) { this.minAge = minAge; }

    public Integer getMaxAge() { return maxAge; }
    public void setMaxAge(Integer maxAge) { this.maxAge = maxAge; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public int getModuleCount() { return moduleCount; }
    public void setModuleCount(int moduleCount) { this.moduleCount = moduleCount; }

    public int getLessonCount() { return lessonCount; }
    public void setLessonCount(int lessonCount) { this.lessonCount = lessonCount; }

    public int getEnrolledCount() { return enrolledCount; }
    public void setEnrolledCount(int enrolledCount) { this.enrolledCount = enrolledCount; }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
