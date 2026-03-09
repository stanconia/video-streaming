package com.videostreaming.user.dto;

import java.time.LocalDateTime;

public class UserSummaryResponse {
    private String id;
    private String email;
    private String displayName;
    private String role;
    private LocalDateTime createdAt;

    public UserSummaryResponse() {}

    public UserSummaryResponse(String id, String email, String displayName, String role, LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.role = role;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
