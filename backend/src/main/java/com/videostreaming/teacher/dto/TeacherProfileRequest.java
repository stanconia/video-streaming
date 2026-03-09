package com.videostreaming.teacher.dto;

public class TeacherProfileRequest {
    private String bio;
    private String headline;
    private String subjects;
    private double hourlyRate;
    private int experienceYears;
    private String profileImageUrl;

    public TeacherProfileRequest() {}

    public TeacherProfileRequest(String bio, String headline, String subjects, double hourlyRate, int experienceYears, String profileImageUrl) {
        this.bio = bio;
        this.headline = headline;
        this.subjects = subjects;
        this.hourlyRate = hourlyRate;
        this.experienceYears = experienceYears;
        this.profileImageUrl = profileImageUrl;
    }

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
}
