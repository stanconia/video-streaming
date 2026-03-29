package com.videostreaming.teacher.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "teacher_profiles")
public class TeacherProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true, columnDefinition = "varchar(255)")
    private String userId;

    @Column(nullable = false, columnDefinition = "varchar(255)")
    private String displayName;

    @Column(columnDefinition = "text")
    private String bio;

    @Column(columnDefinition = "text")
    private String headline;

    @Column(columnDefinition = "text")
    private String subjects;

    @Column(nullable = false)
    private double hourlyRate;

    @Column(nullable = false)
    private int experienceYears;

    @Column(columnDefinition = "varchar(500)")
    private String profileImageUrl;

    @Column(nullable = false)
    private boolean verified;

    @Column(nullable = false)
    private double averageRating;

    @Column(nullable = false)
    private int reviewCount;

    @Column(columnDefinition = "varchar(255)")
    private String stripeAccountId;

    @Column(nullable = false)
    private boolean stripeOnboarded;

    @Column(columnDefinition = "varchar(4)")
    private String bankAccountLast4;

    @Column(columnDefinition = "varchar(100)")
    private String bankAccountHolderName;

    @Column(nullable = false)
    private boolean bankAccountAdded;

    @Column(columnDefinition = "varchar(50)")
    private String backgroundCheckStatus;

    @Column(nullable = false)
    private double totalEarnings;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public TeacherProfile() {}

    public TeacherProfile(String id, String userId, String displayName, String bio, String headline, String subjects, double hourlyRate, int experienceYears, String profileImageUrl, boolean verified, double averageRating, int reviewCount, String stripeAccountId, boolean stripeOnboarded, String backgroundCheckStatus, double totalEarnings, LocalDateTime createdAt) {
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
        this.stripeAccountId = stripeAccountId;
        this.stripeOnboarded = stripeOnboarded;
        this.backgroundCheckStatus = backgroundCheckStatus;
        this.totalEarnings = totalEarnings;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        verified = false;
        averageRating = 0;
        reviewCount = 0;
        stripeOnboarded = false;
        bankAccountAdded = false;
        totalEarnings = 0;
    }

    // Getters and Setters
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

    public String getStripeAccountId() { return stripeAccountId; }
    public void setStripeAccountId(String stripeAccountId) { this.stripeAccountId = stripeAccountId; }

    public boolean isStripeOnboarded() { return stripeOnboarded; }
    public void setStripeOnboarded(boolean stripeOnboarded) { this.stripeOnboarded = stripeOnboarded; }

    public String getBankAccountLast4() { return bankAccountLast4; }
    public void setBankAccountLast4(String bankAccountLast4) { this.bankAccountLast4 = bankAccountLast4; }

    public String getBankAccountHolderName() { return bankAccountHolderName; }
    public void setBankAccountHolderName(String bankAccountHolderName) { this.bankAccountHolderName = bankAccountHolderName; }

    public boolean isBankAccountAdded() { return bankAccountAdded; }
    public void setBankAccountAdded(boolean bankAccountAdded) { this.bankAccountAdded = bankAccountAdded; }

    public String getBackgroundCheckStatus() { return backgroundCheckStatus; }
    public void setBackgroundCheckStatus(String backgroundCheckStatus) { this.backgroundCheckStatus = backgroundCheckStatus; }

    public double getTotalEarnings() { return totalEarnings; }
    public void setTotalEarnings(double totalEarnings) { this.totalEarnings = totalEarnings; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder pattern
    public static TeacherProfileBuilder builder() {
        return new TeacherProfileBuilder();
    }

    public static class TeacherProfileBuilder {
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
        private String stripeAccountId;
        private boolean stripeOnboarded;
        private String backgroundCheckStatus;
        private double totalEarnings;
        private LocalDateTime createdAt;

        public TeacherProfileBuilder id(String id) { this.id = id; return this; }
        public TeacherProfileBuilder userId(String userId) { this.userId = userId; return this; }
        public TeacherProfileBuilder displayName(String displayName) { this.displayName = displayName; return this; }
        public TeacherProfileBuilder bio(String bio) { this.bio = bio; return this; }
        public TeacherProfileBuilder headline(String headline) { this.headline = headline; return this; }
        public TeacherProfileBuilder subjects(String subjects) { this.subjects = subjects; return this; }
        public TeacherProfileBuilder hourlyRate(double hourlyRate) { this.hourlyRate = hourlyRate; return this; }
        public TeacherProfileBuilder experienceYears(int experienceYears) { this.experienceYears = experienceYears; return this; }
        public TeacherProfileBuilder profileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; return this; }
        public TeacherProfileBuilder verified(boolean verified) { this.verified = verified; return this; }
        public TeacherProfileBuilder averageRating(double averageRating) { this.averageRating = averageRating; return this; }
        public TeacherProfileBuilder reviewCount(int reviewCount) { this.reviewCount = reviewCount; return this; }
        public TeacherProfileBuilder stripeAccountId(String stripeAccountId) { this.stripeAccountId = stripeAccountId; return this; }
        public TeacherProfileBuilder stripeOnboarded(boolean stripeOnboarded) { this.stripeOnboarded = stripeOnboarded; return this; }
        public TeacherProfileBuilder backgroundCheckStatus(String backgroundCheckStatus) { this.backgroundCheckStatus = backgroundCheckStatus; return this; }
        public TeacherProfileBuilder totalEarnings(double totalEarnings) { this.totalEarnings = totalEarnings; return this; }
        public TeacherProfileBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public TeacherProfile build() {
            return new TeacherProfile(id, userId, displayName, bio, headline, subjects, hourlyRate, experienceYears, profileImageUrl, verified, averageRating, reviewCount, stripeAccountId, stripeOnboarded, backgroundCheckStatus, totalEarnings, createdAt);
        }
    }
}
