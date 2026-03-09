package com.videostreaming.scheduling.dto;

import java.time.LocalDateTime;

public class ScheduledClassResponse {
    private String id;
    private String teacherUserId;
    private String teacherDisplayName;
    private String title;
    private String description;
    private String subject;
    private LocalDateTime scheduledAt;
    private int durationMinutes;
    private int maxStudents;
    private int enrolledStudents;
    private double price;
    private String currency;
    private String status;
    private Integer ageMin;
    private Integer ageMax;
    private String tags;
    private String thumbnailUrl;
    private Double teacherAverageRating;
    private int waitlistCount;
    private String roomId;
    private String seriesId;
    private String seriesTitle;
    private int materialsCount;
    private LocalDateTime createdAt;

    public ScheduledClassResponse() {}

    public ScheduledClassResponse(String id, String teacherUserId, String teacherDisplayName, String title, String description, String subject, LocalDateTime scheduledAt, int durationMinutes, int maxStudents, int enrolledStudents, double price, String currency, String status, Integer ageMin, Integer ageMax, String tags, String thumbnailUrl, Double teacherAverageRating, int waitlistCount, String roomId, String seriesId, String seriesTitle, int materialsCount, LocalDateTime createdAt) {
        this.id = id;
        this.teacherUserId = teacherUserId;
        this.teacherDisplayName = teacherDisplayName;
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.scheduledAt = scheduledAt;
        this.durationMinutes = durationMinutes;
        this.maxStudents = maxStudents;
        this.enrolledStudents = enrolledStudents;
        this.price = price;
        this.currency = currency;
        this.status = status;
        this.ageMin = ageMin;
        this.ageMax = ageMax;
        this.tags = tags;
        this.thumbnailUrl = thumbnailUrl;
        this.teacherAverageRating = teacherAverageRating;
        this.waitlistCount = waitlistCount;
        this.roomId = roomId;
        this.seriesId = seriesId;
        this.seriesTitle = seriesTitle;
        this.materialsCount = materialsCount;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; }
    public String getTeacherDisplayName() { return teacherDisplayName; }
    public void setTeacherDisplayName(String teacherDisplayName) { this.teacherDisplayName = teacherDisplayName; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public int getMaxStudents() { return maxStudents; }
    public void setMaxStudents(int maxStudents) { this.maxStudents = maxStudents; }
    public int getEnrolledStudents() { return enrolledStudents; }
    public void setEnrolledStudents(int enrolledStudents) { this.enrolledStudents = enrolledStudents; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getAgeMin() { return ageMin; }
    public void setAgeMin(Integer ageMin) { this.ageMin = ageMin; }
    public Integer getAgeMax() { return ageMax; }
    public void setAgeMax(Integer ageMax) { this.ageMax = ageMax; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public Double getTeacherAverageRating() { return teacherAverageRating; }
    public void setTeacherAverageRating(Double teacherAverageRating) { this.teacherAverageRating = teacherAverageRating; }
    public int getWaitlistCount() { return waitlistCount; }
    public void setWaitlistCount(int waitlistCount) { this.waitlistCount = waitlistCount; }
    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }
    public String getSeriesId() { return seriesId; }
    public void setSeriesId(String seriesId) { this.seriesId = seriesId; }
    public String getSeriesTitle() { return seriesTitle; }
    public void setSeriesTitle(String seriesTitle) { this.seriesTitle = seriesTitle; }
    public int getMaterialsCount() { return materialsCount; }
    public void setMaterialsCount(int materialsCount) { this.materialsCount = materialsCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
