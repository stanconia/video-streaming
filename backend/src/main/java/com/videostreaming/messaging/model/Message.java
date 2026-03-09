package com.videostreaming.messaging.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String conversationId;

    @Column(nullable = false)
    private String senderId;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(nullable = false)
    private boolean read;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Message() {}

    public Message(String id, String conversationId, String senderId, String content,
                   boolean read, LocalDateTime createdAt) {
        this.id = id;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.content = content;
        this.read = read;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        read = false;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static MessageBuilder builder() {
        return new MessageBuilder();
    }

    public static class MessageBuilder {
        private String id;
        private String conversationId;
        private String senderId;
        private String content;
        private boolean read;
        private LocalDateTime createdAt;

        public MessageBuilder id(String id) { this.id = id; return this; }
        public MessageBuilder conversationId(String conversationId) { this.conversationId = conversationId; return this; }
        public MessageBuilder senderId(String senderId) { this.senderId = senderId; return this; }
        public MessageBuilder content(String content) { this.content = content; return this; }
        public MessageBuilder read(boolean read) { this.read = read; return this; }
        public MessageBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Message build() {
            return new Message(id, conversationId, senderId, content, read, createdAt);
        }
    }
}
