package com.videostreaming.messaging.dto;

import java.time.LocalDateTime;

public class MessageResponse {
    private String id;
    private String senderId;
    private String senderDisplayName;
    private String content;
    private boolean read;
    private LocalDateTime createdAt;

    public MessageResponse() {}

    public MessageResponse(String id, String senderId, String senderDisplayName,
                            String content, boolean read, LocalDateTime createdAt) {
        this.id = id;
        this.senderId = senderId;
        this.senderDisplayName = senderDisplayName;
        this.content = content;
        this.read = read;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderDisplayName() { return senderDisplayName; }
    public void setSenderDisplayName(String senderDisplayName) { this.senderDisplayName = senderDisplayName; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
