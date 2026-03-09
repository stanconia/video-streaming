package com.videostreaming.scheduling.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "waitlist_entries", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"classId", "studentUserId"})
})
public class WaitlistEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String classId;

    @Column(nullable = false)
    private String studentUserId;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public WaitlistEntry() {}

    public WaitlistEntry(String id, String classId, String studentUserId, int position, LocalDateTime createdAt) {
        this.id = id;
        this.classId = classId;
        this.studentUserId = studentUserId;
        this.position = position;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder pattern
    public static WaitlistEntryBuilder builder() {
        return new WaitlistEntryBuilder();
    }

    public static class WaitlistEntryBuilder {
        private String id;
        private String classId;
        private String studentUserId;
        private int position;
        private LocalDateTime createdAt;

        public WaitlistEntryBuilder id(String id) { this.id = id; return this; }
        public WaitlistEntryBuilder classId(String classId) { this.classId = classId; return this; }
        public WaitlistEntryBuilder studentUserId(String studentUserId) { this.studentUserId = studentUserId; return this; }
        public WaitlistEntryBuilder position(int position) { this.position = position; return this; }
        public WaitlistEntryBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public WaitlistEntry build() {
            return new WaitlistEntry(id, classId, studentUserId, position, createdAt);
        }
    }
}
