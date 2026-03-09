package com.videostreaming.course.dto;

import java.math.BigDecimal;

public class CreateSeriesRequest {
    private String title;
    private String description;
    private String subject;
    private String recurrencePattern;
    private int dayOfWeek;
    private String timeOfDay;
    private int durationMinutes;
    private int maxStudents;
    private BigDecimal price;
    private String currency;
    private int totalSessions;
    private Integer ageMin;
    private Integer ageMax;
    private String tags;
    private String thumbnailUrl;
    private String startDate;

    public CreateSeriesRequest() {}

    public CreateSeriesRequest(String title, String description, String subject,
                               String recurrencePattern, int dayOfWeek, String timeOfDay,
                               int durationMinutes, int maxStudents, BigDecimal price,
                               String currency, int totalSessions, Integer ageMin, Integer ageMax,
                               String tags, String thumbnailUrl, String startDate) {
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.recurrencePattern = recurrencePattern;
        this.dayOfWeek = dayOfWeek;
        this.timeOfDay = timeOfDay;
        this.durationMinutes = durationMinutes;
        this.maxStudents = maxStudents;
        this.price = price;
        this.currency = currency;
        this.totalSessions = totalSessions;
        this.ageMin = ageMin;
        this.ageMax = ageMax;
        this.tags = tags;
        this.thumbnailUrl = thumbnailUrl;
        this.startDate = startDate;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getRecurrencePattern() { return recurrencePattern; }
    public void setRecurrencePattern(String recurrencePattern) { this.recurrencePattern = recurrencePattern; }

    public int getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(int dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getTimeOfDay() { return timeOfDay; }
    public void setTimeOfDay(String timeOfDay) { this.timeOfDay = timeOfDay; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public int getMaxStudents() { return maxStudents; }
    public void setMaxStudents(int maxStudents) { this.maxStudents = maxStudents; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public int getTotalSessions() { return totalSessions; }
    public void setTotalSessions(int totalSessions) { this.totalSessions = totalSessions; }

    public Integer getAgeMin() { return ageMin; }
    public void setAgeMin(Integer ageMin) { this.ageMin = ageMin; }

    public Integer getAgeMax() { return ageMax; }
    public void setAgeMax(Integer ageMax) { this.ageMax = ageMax; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
}
