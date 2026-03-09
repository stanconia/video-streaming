package com.videostreaming.messaging.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"participantOneId", "participantTwoId"})
})
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String participantOneId;

    @Column(nullable = false)
    private String participantTwoId;

    @Column
    private LocalDateTime lastMessageAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Conversation() {}

    public Conversation(String id, String participantOneId, String participantTwoId,
                        LocalDateTime lastMessageAt, LocalDateTime createdAt) {
        this.id = id;
        this.participantOneId = participantOneId;
        this.participantTwoId = participantTwoId;
        this.lastMessageAt = lastMessageAt;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastMessageAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getParticipantOneId() { return participantOneId; }
    public void setParticipantOneId(String participantOneId) { this.participantOneId = participantOneId; }

    public String getParticipantTwoId() { return participantTwoId; }
    public void setParticipantTwoId(String participantTwoId) { this.participantTwoId = participantTwoId; }

    public LocalDateTime getLastMessageAt() { return lastMessageAt; }
    public void setLastMessageAt(LocalDateTime lastMessageAt) { this.lastMessageAt = lastMessageAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static ConversationBuilder builder() {
        return new ConversationBuilder();
    }

    public static class ConversationBuilder {
        private String id;
        private String participantOneId;
        private String participantTwoId;
        private LocalDateTime lastMessageAt;
        private LocalDateTime createdAt;

        public ConversationBuilder id(String id) { this.id = id; return this; }
        public ConversationBuilder participantOneId(String participantOneId) { this.participantOneId = participantOneId; return this; }
        public ConversationBuilder participantTwoId(String participantTwoId) { this.participantTwoId = participantTwoId; return this; }
        public ConversationBuilder lastMessageAt(LocalDateTime lastMessageAt) { this.lastMessageAt = lastMessageAt; return this; }
        public ConversationBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Conversation build() {
            return new Conversation(id, participantOneId, participantTwoId, lastMessageAt, createdAt);
        }
    }
}
