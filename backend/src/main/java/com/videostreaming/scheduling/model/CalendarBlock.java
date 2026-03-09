package com.videostreaming.scheduling.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "calendar_blocks", indexes = {
    @Index(name = "idx_calendar_block_user", columnList = "userId"),
    @Index(name = "idx_calendar_block_user_time", columnList = "userId, startTime, endTime")
})
public class CalendarBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Column(nullable = false)
    private String title;

    @Column
    private String description;

    @Column
    private String sourceType;

    @Column
    private String sourceId;

    @Column
    private String googleCalendarEventId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public CalendarBlock() {}

    public CalendarBlock(String id, String userId, LocalDateTime startTime, LocalDateTime endTime,
                         String title, String description, String sourceType, String sourceId,
                         String googleCalendarEventId, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.title = title;
        this.description = description;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.googleCalendarEventId = googleCalendarEventId;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }

    public String getGoogleCalendarEventId() { return googleCalendarEventId; }
    public void setGoogleCalendarEventId(String googleCalendarEventId) { this.googleCalendarEventId = googleCalendarEventId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static CalendarBlockBuilder builder() {
        return new CalendarBlockBuilder();
    }

    public static class CalendarBlockBuilder {
        private String id;
        private String userId;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String title;
        private String description;
        private String sourceType;
        private String sourceId;
        private String googleCalendarEventId;
        private LocalDateTime createdAt;

        public CalendarBlockBuilder id(String id) { this.id = id; return this; }
        public CalendarBlockBuilder userId(String userId) { this.userId = userId; return this; }
        public CalendarBlockBuilder startTime(LocalDateTime startTime) { this.startTime = startTime; return this; }
        public CalendarBlockBuilder endTime(LocalDateTime endTime) { this.endTime = endTime; return this; }
        public CalendarBlockBuilder title(String title) { this.title = title; return this; }
        public CalendarBlockBuilder description(String description) { this.description = description; return this; }
        public CalendarBlockBuilder sourceType(String sourceType) { this.sourceType = sourceType; return this; }
        public CalendarBlockBuilder sourceId(String sourceId) { this.sourceId = sourceId; return this; }
        public CalendarBlockBuilder googleCalendarEventId(String googleCalendarEventId) { this.googleCalendarEventId = googleCalendarEventId; return this; }
        public CalendarBlockBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public CalendarBlock build() {
            return new CalendarBlock(id, userId, startTime, endTime, title, description, sourceType, sourceId, googleCalendarEventId, createdAt);
        }
    }
}
