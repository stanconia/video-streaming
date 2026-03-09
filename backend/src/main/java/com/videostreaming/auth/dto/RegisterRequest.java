package com.videostreaming.auth.dto;

public class RegisterRequest {
    private String email;
    private String password;
    private String displayName;
    private String role;

    private String phone;
    private String location;
    private String bio;
    // Teacher-specific:
    private String headline;
    private String subjects;
    private int experienceYears;
    private String subjectInterests;

    public RegisterRequest() {}

    public RegisterRequest(String email, String password, String displayName, String role) {
        this.email = email;
        this.password = password;
        this.displayName = displayName;
        this.role = role;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public String getSubjects() { return subjects; }
    public void setSubjects(String subjects) { this.subjects = subjects; }

    public int getExperienceYears() { return experienceYears; }
    public void setExperienceYears(int experienceYears) { this.experienceYears = experienceYears; }

    public String getSubjectInterests() { return subjectInterests; }
    public void setSubjectInterests(String subjectInterests) { this.subjectInterests = subjectInterests; }
}
