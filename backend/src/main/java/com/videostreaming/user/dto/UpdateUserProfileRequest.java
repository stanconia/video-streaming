package com.videostreaming.user.dto;

public class UpdateUserProfileRequest {
    private String email;
    private String displayName;
    private String phone;
    private String location;
    private String bio;
    private String profileImageUrl;
    private String subjectInterests;

    public UpdateUserProfileRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public String getSubjectInterests() { return subjectInterests; }
    public void setSubjectInterests(String subjectInterests) { this.subjectInterests = subjectInterests; }
}
