package com.videostreaming.live.dto;

import com.videostreaming.live.model.ParticipantRole;

public class JoinRoomRequest {
    private String userId;
    private ParticipantRole role;

    public JoinRoomRequest() {}

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public ParticipantRole getRole() { return role; }
    public void setRole(ParticipantRole role) { this.role = role; }
}
