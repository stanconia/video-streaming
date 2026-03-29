package com.videostreaming.messaging.dto;

import jakarta.validation.constraints.NotBlank;

public class SendMessageRequest {
    private String recipientUserId;

    @NotBlank(message = "Message content is required")
    private String content;

    public SendMessageRequest() {}

    public SendMessageRequest(String recipientUserId, String content) {
        this.recipientUserId = recipientUserId;
        this.content = content;
    }

    public String getRecipientUserId() { return recipientUserId; }
    public void setRecipientUserId(String recipientUserId) { this.recipientUserId = recipientUserId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
