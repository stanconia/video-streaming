package com.videostreaming.scheduling.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scheduled_classes")
public class ScheduledClass {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String teacherUserId;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    @Column(nullable = false)
    private int durationMinutes;

    @Column(nullable = false)
    private int maxStudents;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private int enrolledStudents;

    @Column(nullable = false)
    private double price;

    @Column(nullable = false)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClassStatus status;

    private Integer ageMin;

    private Integer ageMax;

    private String tags;

    private String thumbnailUrl;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private int waitlistCount;

    private String roomId;

    private String seriesId;

    @Column
    private String courseId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public ScheduledClass() {}

    public ScheduledClass(String id, String teacherUserId, String title, String description, String subject, LocalDateTime scheduledAt, int durationMinutes, int maxStudents, int enrolledStudents, double price, String currency, ClassStatus status, Integer ageMin, Integer ageMax, String tags, String thumbnailUrl, int waitlistCount, String roomId, String seriesId, String courseId, LocalDateTime createdAt) {
        this.id = id;
        this.teacherUserId = teacherUserId;
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.scheduledAt = scheduledAt;
        this.durationMinutes = durationMinutes;
        this.maxStudents = maxStudents;
        this.enrolledStudents = enrolledStudents;
        this.price = price;
        this.currency = currency;
        this.status = status;
        this.ageMin = ageMin;
        this.ageMax = ageMax;
        this.tags = tags;
        this.thumbnailUrl = thumbnailUrl;
        this.waitlistCount = waitlistCount;
        this.roomId = roomId;
        this.seriesId = seriesId;
        this.courseId = courseId;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        status = ClassStatus.OPEN;
        enrolledStudents = 0;
        waitlistCount = 0;
        if (currency == null) {
            currency = "USD";
        }
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public int getMaxStudents() { return maxStudents; }
    public void setMaxStudents(int maxStudents) { this.maxStudents = maxStudents; }

    public int getEnrolledStudents() { return enrolledStudents; }
    public void setEnrolledStudents(int enrolledStudents) { this.enrolledStudents = enrolledStudents; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public ClassStatus getStatus() { return status; }
    public void setStatus(ClassStatus status) { this.status = status; }

    public Integer getAgeMin() { return ageMin; }
    public void setAgeMin(Integer ageMin) { this.ageMin = ageMin; }

    public Integer getAgeMax() { return ageMax; }
    public void setAgeMax(Integer ageMax) { this.ageMax = ageMax; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public int getWaitlistCount() { return waitlistCount; }
    public void setWaitlistCount(int waitlistCount) { this.waitlistCount = waitlistCount; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getSeriesId() { return seriesId; }
    public void setSeriesId(String seriesId) { this.seriesId = seriesId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder pattern
    public static ScheduledClassBuilder builder() {
        return new ScheduledClassBuilder();
    }

    public static class ScheduledClassBuilder {
        private String id;
        private String teacherUserId;
        private String title;
        private String description;
        private String subject;
        private LocalDateTime scheduledAt;
        private int durationMinutes;
        private int maxStudents;
        private int enrolledStudents;
        private double price;
        private String currency;
        private ClassStatus status;
        private Integer ageMin;
        private Integer ageMax;
        private String tags;
        private String thumbnailUrl;
        private int waitlistCount;
        private String roomId;
        private String seriesId;
        private String courseId;
        private LocalDateTime createdAt;

        public ScheduledClassBuilder id(String id) { this.id = id; return this; }
        public ScheduledClassBuilder teacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; return this; }
        public ScheduledClassBuilder title(String title) { this.title = title; return this; }
        public ScheduledClassBuilder description(String description) { this.description = description; return this; }
        public ScheduledClassBuilder subject(String subject) { this.subject = subject; return this; }
        public ScheduledClassBuilder scheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; return this; }
        public ScheduledClassBuilder durationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; return this; }
        public ScheduledClassBuilder maxStudents(int maxStudents) { this.maxStudents = maxStudents; return this; }
        public ScheduledClassBuilder enrolledStudents(int enrolledStudents) { this.enrolledStudents = enrolledStudents; return this; }
        public ScheduledClassBuilder price(double price) { this.price = price; return this; }
        public ScheduledClassBuilder currency(String currency) { this.currency = currency; return this; }
        public ScheduledClassBuilder status(ClassStatus status) { this.status = status; return this; }
        public ScheduledClassBuilder ageMin(Integer ageMin) { this.ageMin = ageMin; return this; }
        public ScheduledClassBuilder ageMax(Integer ageMax) { this.ageMax = ageMax; return this; }
        public ScheduledClassBuilder tags(String tags) { this.tags = tags; return this; }
        public ScheduledClassBuilder thumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; return this; }
        public ScheduledClassBuilder waitlistCount(int waitlistCount) { this.waitlistCount = waitlistCount; return this; }
        public ScheduledClassBuilder roomId(String roomId) { this.roomId = roomId; return this; }
        public ScheduledClassBuilder seriesId(String seriesId) { this.seriesId = seriesId; return this; }
        public ScheduledClassBuilder courseId(String courseId) { this.courseId = courseId; return this; }
        public ScheduledClassBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public ScheduledClass build() {
            return new ScheduledClass(id, teacherUserId, title, description, subject, scheduledAt, durationMinutes, maxStudents, enrolledStudents, price, currency, status, ageMin, ageMax, tags, thumbnailUrl, waitlistCount, roomId, seriesId, courseId, createdAt);
        }
    }
}
