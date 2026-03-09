package com.videostreaming.user.dto;

import java.time.LocalDateTime;

public class UserProfileResponse {
    private String id;
    private String displayName;
    private String email;
    private String role;
    private String phone;
    private String location;
    private String bio;
    private String profileImageUrl;
    private LocalDateTime createdAt;
    private Long enrolledCoursesCount;
    private Long completedCoursesCount;
    private String teacherProfileUserId;
    private String subjectInterests;

    public UserProfileResponse() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getEnrolledCoursesCount() { return enrolledCoursesCount; }
    public void setEnrolledCoursesCount(Long enrolledCoursesCount) { this.enrolledCoursesCount = enrolledCoursesCount; }

    public Long getCompletedCoursesCount() { return completedCoursesCount; }
    public void setCompletedCoursesCount(Long completedCoursesCount) { this.completedCoursesCount = completedCoursesCount; }

    public String getTeacherProfileUserId() { return teacherProfileUserId; }
    public void setTeacherProfileUserId(String teacherProfileUserId) { this.teacherProfileUserId = teacherProfileUserId; }

    public String getSubjectInterests() { return subjectInterests; }
    public void setSubjectInterests(String subjectInterests) { this.subjectInterests = subjectInterests; }
}
