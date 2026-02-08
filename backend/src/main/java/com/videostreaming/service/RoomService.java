package com.videostreaming.service;

import com.videostreaming.model.Participant;
import com.videostreaming.model.ParticipantRole;
import com.videostreaming.model.Room;
import com.videostreaming.repository.ParticipantRepository;
import com.videostreaming.repository.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class RoomService {

    private static final Logger logger = LoggerFactory.getLogger(RoomService.class);

    private final RoomRepository roomRepository;
    private final ParticipantRepository participantRepository;

    public RoomService(RoomRepository roomRepository, ParticipantRepository participantRepository) {
        this.roomRepository = roomRepository;
        this.participantRepository = participantRepository;
    }

    @Transactional
    public Room createRoom(String name) {
        Room room = Room.builder()
                .name(name)
                .active(true)
                .build();

        Room savedRoom = roomRepository.save(room);
        logger.info("Created room: {} with id: {}", name, savedRoom.getId());
        return savedRoom;
    }

    public List<Room> getAllActiveRooms() {
        return roomRepository.findByActiveTrue();
    }

    public Optional<Room> getRoomById(String roomId) {
        return roomRepository.findById(roomId);
    }

    @Transactional
    public Participant joinRoom(String roomId, String userId, ParticipantRole role, String sessionId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + roomId));

        // Check if room already has a broadcaster
        if (role == ParticipantRole.BROADCASTER && room.getBroadcasterId() != null) {
            throw new IllegalStateException("Room already has a broadcaster");
        }

        Participant participant = Participant.builder()
                .userId(userId)
                .role(role)
                .webSocketSessionId(sessionId)
                .build();

        room.addParticipant(participant);

        if (role == ParticipantRole.BROADCASTER) {
            room.setBroadcasterId(userId);
        }

        participantRepository.save(participant);
        roomRepository.save(room);

        logger.info("User {} joined room {} as {}", userId, roomId, role);
        return participant;
    }

    @Transactional
    public void leaveRoom(String sessionId) {
        Optional<Participant> participantOpt = participantRepository.findByWebSocketSessionId(sessionId);

        if (participantOpt.isPresent()) {
            Participant participant = participantOpt.get();
            Room room = participant.getRoom();

            logger.info("User {} leaving room {}", participant.getUserId(), room.getId());

            // If broadcaster is leaving, mark room as inactive
            if (participant.getRole() == ParticipantRole.BROADCASTER) {
                room.setActive(false);
                room.setBroadcasterId(null);
                logger.info("Broadcaster left, room {} is now inactive", room.getId());
            }

            room.removeParticipant(participant);
            participantRepository.delete(participant);
            roomRepository.save(room);
        }
    }

    @Transactional
    public void deleteRoom(String roomId) {
        roomRepository.deleteById(roomId);
        logger.info("Deleted room: {}", roomId);
    }

    public List<Participant> getParticipants(String roomId) {
        return participantRepository.findByRoomId(roomId);
    }
}
