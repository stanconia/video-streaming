package com.videostreaming.scheduling.dto;

public class CreateScheduledClassRequest {
    private String title;
    private String description;
    private String subject;
    private String scheduledAt;
    private int durationMinutes;
    private int maxStudents;
    private double price;
    private String currency;
    private Integer ageMin;
    private Integer ageMax;
    private String tags;
    private String thumbnailUrl;
    private String courseId;

    public CreateScheduledClassRequest() {}

    public CreateScheduledClassRequest(String title, String description, String subject, String scheduledAt, int durationMinutes, int maxStudents, double price, String currency, Integer ageMin, Integer ageMax, String tags, String thumbnailUrl) {
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.scheduledAt = scheduledAt;
        this.durationMinutes = durationMinutes;
        this.maxStudents = maxStudents;
        this.price = price;
        this.currency = currency;
        this.ageMin = ageMin;
        this.ageMax = ageMax;
        this.tags = tags;
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(String scheduledAt) { this.scheduledAt = scheduledAt; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public int getMaxStudents() { return maxStudents; }
    public void setMaxStudents(int maxStudents) { this.maxStudents = maxStudents; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Integer getAgeMin() { return ageMin; }
    public void setAgeMin(Integer ageMin) { this.ageMin = ageMin; }
    public Integer getAgeMax() { return ageMax; }
    public void setAgeMax(Integer ageMax) { this.ageMax = ageMax; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
}
