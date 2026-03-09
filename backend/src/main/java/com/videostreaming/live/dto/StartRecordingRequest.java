package com.videostreaming.live.dto;

public class StartRecordingRequest {
    private String roomId;
    private String userId;

    public StartRecordingRequest() {}

    public StartRecordingRequest(String roomId, String userId) {
        this.roomId = roomId;
        this.userId = userId;
    }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
