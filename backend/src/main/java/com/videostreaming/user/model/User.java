package com.videostreaming.user.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true)
    private String password;

    @Column(nullable = false)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(columnDefinition = "varchar(20)")
    private String phone;

    @Column(columnDefinition = "varchar(255)")
    private String location;

    @Column(columnDefinition = "text")
    private String bio;

    @Column(columnDefinition = "varchar(500)")
    private String profileImageUrl;

    @Column(columnDefinition = "varchar(500)")
    private String subjectInterests;

    @Column
    private LocalDate dateOfBirth;

    @Column
    private String parentEmail;

    @Column
    private boolean parentalConsentGranted = false;

    @Column(columnDefinition = "varchar(20)")
    private String authProvider = "LOCAL";

    @Column(unique = true)
    private String googleId;

    @Column(length = 2000)
    private String googleAccessToken;

    @Column(length = 2000)
    private String googleRefreshToken;

    @Column
    private LocalDateTime googleTokenExpiresAt;

    public User() {}

    public User(String id, String email, String password, String displayName, UserRole role, LocalDateTime createdAt,
                String phone, String location, String bio, String profileImageUrl, String subjectInterests,
                LocalDate dateOfBirth, String parentEmail, boolean parentalConsentGranted,
                String authProvider, String googleId, String googleAccessToken, String googleRefreshToken,
                LocalDateTime googleTokenExpiresAt) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.displayName = displayName;
        this.role = role;
        this.createdAt = createdAt;
        this.phone = phone;
        this.location = location;
        this.bio = bio;
        this.profileImageUrl = profileImageUrl;
        this.subjectInterests = subjectInterests;
        this.dateOfBirth = dateOfBirth;
        this.parentEmail = parentEmail;
        this.parentalConsentGranted = parentalConsentGranted;
        this.authProvider = authProvider;
        this.googleId = googleId;
        this.googleAccessToken = googleAccessToken;
        this.googleRefreshToken = googleRefreshToken;
        this.googleTokenExpiresAt = googleTokenExpiresAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

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

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getParentEmail() { return parentEmail; }
    public void setParentEmail(String parentEmail) { this.parentEmail = parentEmail; }

    public boolean isParentalConsentGranted() { return parentalConsentGranted; }
    public void setParentalConsentGranted(boolean parentalConsentGranted) { this.parentalConsentGranted = parentalConsentGranted; }

    public String getAuthProvider() { return authProvider; }
    public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }

    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }

    public String getGoogleAccessToken() { return googleAccessToken; }
    public void setGoogleAccessToken(String googleAccessToken) { this.googleAccessToken = googleAccessToken; }

    public String getGoogleRefreshToken() { return googleRefreshToken; }
    public void setGoogleRefreshToken(String googleRefreshToken) { this.googleRefreshToken = googleRefreshToken; }

    public LocalDateTime getGoogleTokenExpiresAt() { return googleTokenExpiresAt; }
    public void setGoogleTokenExpiresAt(LocalDateTime googleTokenExpiresAt) { this.googleTokenExpiresAt = googleTokenExpiresAt; }

    // Builder pattern
    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private String id;
        private String email;
        private String password;
        private String displayName;
        private UserRole role;
        private LocalDateTime createdAt;
        private String phone;
        private String location;
        private String bio;
        private String profileImageUrl;
        private String subjectInterests;
        private LocalDate dateOfBirth;
        private String parentEmail;
        private boolean parentalConsentGranted;
        private String authProvider = "LOCAL";
        private String googleId;
        private String googleAccessToken;
        private String googleRefreshToken;
        private LocalDateTime googleTokenExpiresAt;

        public UserBuilder id(String id) { this.id = id; return this; }
        public UserBuilder email(String email) { this.email = email; return this; }
        public UserBuilder password(String password) { this.password = password; return this; }
        public UserBuilder displayName(String displayName) { this.displayName = displayName; return this; }
        public UserBuilder role(UserRole role) { this.role = role; return this; }
        public UserBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public UserBuilder phone(String phone) { this.phone = phone; return this; }
        public UserBuilder location(String location) { this.location = location; return this; }
        public UserBuilder bio(String bio) { this.bio = bio; return this; }
        public UserBuilder profileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; return this; }
        public UserBuilder subjectInterests(String subjectInterests) { this.subjectInterests = subjectInterests; return this; }
        public UserBuilder dateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; return this; }
        public UserBuilder parentEmail(String parentEmail) { this.parentEmail = parentEmail; return this; }
        public UserBuilder parentalConsentGranted(boolean parentalConsentGranted) { this.parentalConsentGranted = parentalConsentGranted; return this; }
        public UserBuilder authProvider(String authProvider) { this.authProvider = authProvider; return this; }
        public UserBuilder googleId(String googleId) { this.googleId = googleId; return this; }
        public UserBuilder googleAccessToken(String googleAccessToken) { this.googleAccessToken = googleAccessToken; return this; }
        public UserBuilder googleRefreshToken(String googleRefreshToken) { this.googleRefreshToken = googleRefreshToken; return this; }
        public UserBuilder googleTokenExpiresAt(LocalDateTime googleTokenExpiresAt) { this.googleTokenExpiresAt = googleTokenExpiresAt; return this; }

        public User build() {
            return new User(id, email, password, displayName, role, createdAt, phone, location, bio, profileImageUrl, subjectInterests, dateOfBirth, parentEmail, parentalConsentGranted, authProvider, googleId, googleAccessToken, googleRefreshToken, googleTokenExpiresAt);
        }
    }
}
