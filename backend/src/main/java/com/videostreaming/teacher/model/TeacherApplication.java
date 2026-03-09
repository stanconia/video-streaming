package com.videostreaming.teacher.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "teacher_applications")
public class TeacherApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    @Column(length = 2000)
    private String notes;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    private LocalDateTime reviewedAt;

    private String reviewedBy;

    public TeacherApplication() {}

    public TeacherApplication(String id, String userId, ApplicationStatus status, String notes, LocalDateTime submittedAt, LocalDateTime reviewedAt, String reviewedBy) {
        this.id = id;
        this.userId = userId;
        this.status = status;
        this.notes = notes;
        this.submittedAt = submittedAt;
        this.reviewedAt = reviewedAt;
        this.reviewedBy = reviewedBy;
    }

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
        status = ApplicationStatus.PENDING;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    // Builder pattern
    public static TeacherApplicationBuilder builder() {
        return new TeacherApplicationBuilder();
    }

    public static class TeacherApplicationBuilder {
        private String id;
        private String userId;
        private ApplicationStatus status;
        private String notes;
        private LocalDateTime submittedAt;
        private LocalDateTime reviewedAt;
        private String reviewedBy;

        public TeacherApplicationBuilder id(String id) { this.id = id; return this; }
        public TeacherApplicationBuilder userId(String userId) { this.userId = userId; return this; }
        public TeacherApplicationBuilder status(ApplicationStatus status) { this.status = status; return this; }
        public TeacherApplicationBuilder notes(String notes) { this.notes = notes; return this; }
        public TeacherApplicationBuilder submittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; return this; }
        public TeacherApplicationBuilder reviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; return this; }
        public TeacherApplicationBuilder reviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; return this; }

        public TeacherApplication build() {
            return new TeacherApplication(id, userId, status, notes, submittedAt, reviewedAt, reviewedBy);
        }
    }
}
