package com.videostreaming.live.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recordings")
public class Recording {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String roomId;

    @Column(nullable = false)
    private String roomName;

    @Column(nullable = false)
    private String startedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecordingStatus status;

    @Column
    private String s3Key;

    @Column
    private String s3Bucket;

    @Column
    private Long durationMs;

    @Column
    private Long fileSizeBytes;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime completedAt;

    @Column
    private String errorMessage;

    @Column
    private String captionS3Key;

    public Recording() {}

    public Recording(String id, String roomId, String roomName, String startedByUserId,
                     RecordingStatus status, String s3Key, String s3Bucket, Long durationMs,
                     Long fileSizeBytes, LocalDateTime createdAt, LocalDateTime completedAt,
                     String errorMessage, String captionS3Key) {
        this.id = id;
        this.roomId = roomId;
        this.roomName = roomName;
        this.startedByUserId = startedByUserId;
        this.status = status;
        this.s3Key = s3Key;
        this.s3Bucket = s3Bucket;
        this.durationMs = durationMs;
        this.fileSizeBytes = fileSizeBytes;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
        this.errorMessage = errorMessage;
        this.captionS3Key = captionS3Key;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = RecordingStatus.STARTING;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public String getStartedByUserId() { return startedByUserId; }
    public void setStartedByUserId(String startedByUserId) { this.startedByUserId = startedByUserId; }

    public RecordingStatus getStatus() { return status; }
    public void setStatus(RecordingStatus status) { this.status = status; }

    public String getS3Key() { return s3Key; }
    public void setS3Key(String s3Key) { this.s3Key = s3Key; }

    public String getS3Bucket() { return s3Bucket; }
    public void setS3Bucket(String s3Bucket) { this.s3Bucket = s3Bucket; }

    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }

    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public String getCaptionS3Key() { return captionS3Key; }
    public void setCaptionS3Key(String captionS3Key) { this.captionS3Key = captionS3Key; }

    // Builder
    public static RecordingBuilder builder() {
        return new RecordingBuilder();
    }

    public static class RecordingBuilder {
        private String id;
        private String roomId;
        private String roomName;
        private String startedByUserId;
        private RecordingStatus status;
        private String s3Key;
        private String s3Bucket;
        private Long durationMs;
        private Long fileSizeBytes;
        private LocalDateTime createdAt;
        private LocalDateTime completedAt;
        private String errorMessage;
        private String captionS3Key;

        public RecordingBuilder id(String id) { this.id = id; return this; }
        public RecordingBuilder roomId(String roomId) { this.roomId = roomId; return this; }
        public RecordingBuilder roomName(String roomName) { this.roomName = roomName; return this; }
        public RecordingBuilder startedByUserId(String startedByUserId) { this.startedByUserId = startedByUserId; return this; }
        public RecordingBuilder status(RecordingStatus status) { this.status = status; return this; }
        public RecordingBuilder s3Key(String s3Key) { this.s3Key = s3Key; return this; }
        public RecordingBuilder s3Bucket(String s3Bucket) { this.s3Bucket = s3Bucket; return this; }
        public RecordingBuilder durationMs(Long durationMs) { this.durationMs = durationMs; return this; }
        public RecordingBuilder fileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; return this; }
        public RecordingBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public RecordingBuilder completedAt(LocalDateTime completedAt) { this.completedAt = completedAt; return this; }
        public RecordingBuilder errorMessage(String errorMessage) { this.errorMessage = errorMessage; return this; }
        public RecordingBuilder captionS3Key(String captionS3Key) { this.captionS3Key = captionS3Key; return this; }

        public Recording build() {
            return new Recording(id, roomId, roomName, startedByUserId, status, s3Key, s3Bucket,
                    durationMs, fileSizeBytes, createdAt, completedAt, errorMessage, captionS3Key);
        }
    }
}
