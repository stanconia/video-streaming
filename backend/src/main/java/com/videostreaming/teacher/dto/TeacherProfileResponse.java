package com.videostreaming.teacher.dto;

import java.time.LocalDateTime;

public class TeacherProfileResponse {
    private String id;
    private String userId;
    private String displayName;
    private String bio;
    private String headline;
    private String subjects;
    private double hourlyRate;
    private int experienceYears;
    private String profileImageUrl;
    private boolean verified;
    private double averageRating;
    private int reviewCount;
    private LocalDateTime createdAt;

    public TeacherProfileResponse() {}

    public TeacherProfileResponse(String id, String userId, String displayName, String bio, String headline, String subjects, double hourlyRate, int experienceYears, String profileImageUrl, boolean verified, double averageRating, int reviewCount, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.displayName = displayName;
        this.bio = bio;
        this.headline = headline;
        this.subjects = subjects;
        this.hourlyRate = hourlyRate;
        this.experienceYears = experienceYears;
        this.profileImageUrl = profileImageUrl;
        this.verified = verified;
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }
    public String getSubjects() { return subjects; }
    public void setSubjects(String subjects) { this.subjects = subjects; }
    public double getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(double hourlyRate) { this.hourlyRate = hourlyRate; }
    public int getExperienceYears() { return experienceYears; }
    public void setExperienceYears(int experienceYears) { this.experienceYears = experienceYears; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
