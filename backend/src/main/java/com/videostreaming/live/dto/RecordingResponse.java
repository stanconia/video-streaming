package com.videostreaming.live.dto;

import java.time.LocalDateTime;

public class RecordingResponse {
    private String id;
    private String roomId;
    private String roomName;
    private String startedByUserId;
    private String status;
    private Long durationMs;
    private Long fileSizeBytes;
    private String playbackUrl;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    public RecordingResponse() {}

    public RecordingResponse(String id, String roomId, String roomName, String startedByUserId,
                             String status, Long durationMs, Long fileSizeBytes, String playbackUrl,
                             LocalDateTime createdAt, LocalDateTime completedAt) {
        this.id = id;
        this.roomId = roomId;
        this.roomName = roomName;
        this.startedByUserId = startedByUserId;
        this.status = status;
        this.durationMs = durationMs;
        this.fileSizeBytes = fileSizeBytes;
        this.playbackUrl = playbackUrl;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public String getStartedByUserId() { return startedByUserId; }
    public void setStartedByUserId(String startedByUserId) { this.startedByUserId = startedByUserId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }

    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public String getPlaybackUrl() { return playbackUrl; }
    public void setPlaybackUrl(String playbackUrl) { this.playbackUrl = playbackUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
