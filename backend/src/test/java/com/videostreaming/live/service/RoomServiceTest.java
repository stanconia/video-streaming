package com.videostreaming.live.service;

import com.videostreaming.live.model.Participant;
import com.videostreaming.live.model.ParticipantRole;
import com.videostreaming.live.model.Room;
import com.videostreaming.live.repository.ParticipantRepository;
import com.videostreaming.live.repository.RoomRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {

    @Mock private RoomRepository roomRepository;
    @Mock private ParticipantRepository participantRepository;

    @InjectMocks private RoomService service;

    @Test
    void createRoom_success() {
        String roomName = "Test Room";

        Room savedRoom = Room.builder()
                .id("room-1")
                .name(roomName)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(roomRepository.save(any(Room.class))).thenReturn(savedRoom);

        Room result = service.createRoom(roomName);

        assertNotNull(result);
        assertEquals("room-1", result.getId());
        assertEquals(roomName, result.getName());
        assertTrue(result.isActive());
        verify(roomRepository).save(any(Room.class));
    }

    @Test
    void joinRoom_success() {
        String roomId = "room-1";
        String userId = "user-1";
        String sessionId = "session-1";

        Room room = Room.builder()
                .id(roomId)
                .name("Test Room")
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        Participant savedParticipant = Participant.builder()
                .id("participant-1")
                .userId(userId)
                .role(ParticipantRole.VIEWER)
                .room(room)
                .joinedAt(LocalDateTime.now())
                .webSocketSessionId(sessionId)
                .build();

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(participantRepository.save(any(Participant.class))).thenReturn(savedParticipant);
        when(roomRepository.save(any(Room.class))).thenReturn(room);

        Participant result = service.joinRoom(roomId, userId, ParticipantRole.VIEWER, sessionId);

        assertNotNull(result);
        assertEquals(userId, result.getUserId());
        assertEquals(ParticipantRole.VIEWER, result.getRole());
        verify(participantRepository).save(any(Participant.class));
        verify(roomRepository).save(any(Room.class));
    }

    @Test
    void leaveRoom_success() {
        String sessionId = "session-1";

        Room room = Room.builder()
                .id("room-1")
                .name("Test Room")
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        Participant participant = Participant.builder()
                .id("participant-1")
                .userId("user-1")
                .role(ParticipantRole.VIEWER)
                .room(room)
                .joinedAt(LocalDateTime.now())
                .webSocketSessionId(sessionId)
                .build();
        participant.setRoom(room);

        when(participantRepository.findByWebSocketSessionId(sessionId)).thenReturn(Optional.of(participant));
        when(roomRepository.save(any(Room.class))).thenReturn(room);

        service.leaveRoom(sessionId);

        verify(participantRepository).delete(participant);
        verify(roomRepository).save(any(Room.class));
        // Room stays active because VIEWER left, not BROADCASTER
        assertTrue(room.isActive());
    }

    @Test
    void getRoomById_found() {
        String roomId = "room-1";

        Room room = Room.builder()
                .id(roomId)
                .name("Test Room")
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));

        Optional<Room> result = service.getRoomById(roomId);

        assertTrue(result.isPresent());
        assertEquals(roomId, result.get().getId());
        assertEquals("Test Room", result.get().getName());
    }

    @Test
    void getRoomById_notFound_returnsEmpty() {
        String roomId = "nonexistent";

        when(roomRepository.findById(roomId)).thenReturn(Optional.empty());

        Optional<Room> result = service.getRoomById(roomId);

        assertFalse(result.isPresent());
    }
}
