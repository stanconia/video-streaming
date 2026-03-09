package com.videostreaming.live.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column
    private String broadcasterId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean active;

    @JsonIgnore
    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Participant> participants = new HashSet<>();

    public Room() {}

    public Room(String id, String name, String broadcasterId, LocalDateTime createdAt, boolean active, Set<Participant> participants) {
        this.id = id;
        this.name = name;
        this.broadcasterId = broadcasterId;
        this.createdAt = createdAt;
        this.active = active;
        this.participants = participants != null ? participants : new HashSet<>();
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        active = true;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBroadcasterId() { return broadcasterId; }
    public void setBroadcasterId(String broadcasterId) { this.broadcasterId = broadcasterId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Set<Participant> getParticipants() { return participants; }
    public void setParticipants(Set<Participant> participants) { this.participants = participants; }

    public void addParticipant(Participant participant) {
        participants.add(participant);
        participant.setRoom(this);
    }

    public void removeParticipant(Participant participant) {
        participants.remove(participant);
        participant.setRoom(null);
    }

    // Builder pattern
    public static RoomBuilder builder() {
        return new RoomBuilder();
    }

    public static class RoomBuilder {
        private String id;
        private String name;
        private String broadcasterId;
        private LocalDateTime createdAt;
        private boolean active;
        private Set<Participant> participants = new HashSet<>();

        public RoomBuilder id(String id) { this.id = id; return this; }
        public RoomBuilder name(String name) { this.name = name; return this; }
        public RoomBuilder broadcasterId(String broadcasterId) { this.broadcasterId = broadcasterId; return this; }
        public RoomBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public RoomBuilder active(boolean active) { this.active = active; return this; }
        public RoomBuilder participants(Set<Participant> participants) { this.participants = participants; return this; }

        public Room build() {
            return new Room(id, name, broadcasterId, createdAt, active, participants);
        }
    }
}
