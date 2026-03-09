package com.videostreaming.live.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "live_sessions")
public class LiveSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, columnDefinition = "varchar(255)")
    private String courseId;

    @Column(columnDefinition = "varchar(255)")
    private String moduleId;

    @Column(nullable = false, columnDefinition = "varchar(255)")
    private String teacherUserId;

    @Column(nullable = false, columnDefinition = "varchar(255)")
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    @Column(nullable = false)
    private int durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private LiveSessionStatus status;

    @Column(columnDefinition = "varchar(255)")
    private String roomId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public LiveSession() {}

    public LiveSession(String id, String courseId, String moduleId, String teacherUserId, String title, String description, LocalDateTime scheduledAt, int durationMinutes, LiveSessionStatus status, String roomId, LocalDateTime createdAt) {
        this.id = id;
        this.courseId = courseId;
        this.moduleId = moduleId;
        this.teacherUserId = teacherUserId;
        this.title = title;
        this.description = description;
        this.scheduledAt = scheduledAt;
        this.durationMinutes = durationMinutes;
        this.status = status;
        this.roomId = roomId;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        status = LiveSessionStatus.SCHEDULED;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public String getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public LiveSessionStatus getStatus() { return status; }
    public void setStatus(LiveSessionStatus status) { this.status = status; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder pattern
    public static LiveSessionBuilder builder() {
        return new LiveSessionBuilder();
    }

    public static class LiveSessionBuilder {
        private String id;
        private String courseId;
        private String moduleId;
        private String teacherUserId;
        private String title;
        private String description;
        private LocalDateTime scheduledAt;
        private int durationMinutes;
        private LiveSessionStatus status;
        private String roomId;
        private LocalDateTime createdAt;

        public LiveSessionBuilder id(String id) { this.id = id; return this; }
        public LiveSessionBuilder courseId(String courseId) { this.courseId = courseId; return this; }
        public LiveSessionBuilder moduleId(String moduleId) { this.moduleId = moduleId; return this; }
        public LiveSessionBuilder teacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; return this; }
        public LiveSessionBuilder title(String title) { this.title = title; return this; }
        public LiveSessionBuilder description(String description) { this.description = description; return this; }
        public LiveSessionBuilder scheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; return this; }
        public LiveSessionBuilder durationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; return this; }
        public LiveSessionBuilder status(LiveSessionStatus status) { this.status = status; return this; }
        public LiveSessionBuilder roomId(String roomId) { this.roomId = roomId; return this; }
        public LiveSessionBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public LiveSession build() {
            return new LiveSession(id, courseId, moduleId, teacherUserId, title, description, scheduledAt, durationMinutes, status, roomId, createdAt);
        }
    }
}
