package com.videostreaming.live.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "participants")
public class Participant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipantRole role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    @Column(unique = true)
    private String webSocketSessionId;

    public Participant() {}

    public Participant(String id, String userId, ParticipantRole role, Room room, LocalDateTime joinedAt, String webSocketSessionId) {
        this.id = id;
        this.userId = userId;
        this.role = role;
        this.room = room;
        this.joinedAt = joinedAt;
        this.webSocketSessionId = webSocketSessionId;
    }

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public ParticipantRole getRole() { return role; }
    public void setRole(ParticipantRole role) { this.role = role; }

    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }

    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }

    public String getWebSocketSessionId() { return webSocketSessionId; }
    public void setWebSocketSessionId(String webSocketSessionId) { this.webSocketSessionId = webSocketSessionId; }

    // Builder pattern
    public static ParticipantBuilder builder() {
        return new ParticipantBuilder();
    }

    public static class ParticipantBuilder {
        private String id;
        private String userId;
        private ParticipantRole role;
        private Room room;
        private LocalDateTime joinedAt;
        private String webSocketSessionId;

        public ParticipantBuilder id(String id) { this.id = id; return this; }
        public ParticipantBuilder userId(String userId) { this.userId = userId; return this; }
        public ParticipantBuilder role(ParticipantRole role) { this.role = role; return this; }
        public ParticipantBuilder room(Room room) { this.room = room; return this; }
        public ParticipantBuilder joinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; return this; }
        public ParticipantBuilder webSocketSessionId(String webSocketSessionId) { this.webSocketSessionId = webSocketSessionId; return this; }

        public Participant build() {
            return new Participant(id, userId, role, room, joinedAt, webSocketSessionId);
        }
    }
}
