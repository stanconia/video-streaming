package com.videostreaming.messaging.dto;

public class SendMessageRequest {
    private String recipientUserId;
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
