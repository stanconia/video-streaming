package com.videostreaming.live.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.videostreaming.ai.service.AiCompanionService;
import com.videostreaming.live.service.MediaServerClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SignalingWebSocketHandlerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock private MediaServerClient mediaServerClient;
    @Mock private AiCompanionService aiCompanionService;

    private SignalingWebSocketHandler handler;

    @BeforeEach
    void setUp() {
        handler = new SignalingWebSocketHandler(objectMapper, mediaServerClient, aiCompanionService);
    }

    private WebSocketSession createMockSession(String sessionId) throws Exception {
        WebSocketSession session = mock(WebSocketSession.class);
        lenient().when(session.getId()).thenReturn(sessionId);
        lenient().when(session.isOpen()).thenReturn(true);
        Map<String, Object> attributes = new HashMap<>();
        lenient().when(session.getAttributes()).thenReturn(attributes);
        return session;
    }

    private void joinRoom(WebSocketSession session, String roomId, String role, String userId) throws Exception {
        // Stub media server response for join-room
        String mediaResponse = objectMapper.writeValueAsString(Map.of(
                "type", "room-joined",
                "roomId", roomId,
                "requestId", "req-join"
        ));
        lenient().when(mediaServerClient.forwardSignalingMessage(anyString(), anyString()))
                .thenReturn(mediaResponse);

        String joinMessage = objectMapper.writeValueAsString(Map.of(
                "type", "join-room",
                "roomId", roomId,
                "role", role,
                "userId", userId,
                "requestId", "req-join"
        ));
        handler.handleTextMessage(session, new TextMessage(joinMessage));
    }

    // ===== Session-ended on broadcaster disconnect =====

    @Test
    void broadcasterDisconnect_sendsSessionEndedToViewers() throws Exception {
        WebSocketSession broadcaster = createMockSession("session-broadcaster");
        WebSocketSession viewer1 = createMockSession("session-viewer1");
        WebSocketSession viewer2 = createMockSession("session-viewer2");

        handler.afterConnectionEstablished(broadcaster);
        handler.afterConnectionEstablished(viewer1);
        handler.afterConnectionEstablished(viewer2);

        joinRoom(broadcaster, "room-1", "broadcaster", "teacher-1");
        joinRoom(viewer1, "room-1", "viewer", "student-1");
        joinRoom(viewer2, "room-1", "viewer", "student-2");

        // Clear interaction history so we only capture post-disconnect messages
        clearInvocations(viewer1, viewer2);

        // Act: broadcaster disconnects
        handler.afterConnectionClosed(broadcaster, CloseStatus.NORMAL);

        // Assert: both viewers received session-ended notification
        ArgumentCaptor<TextMessage> captor1 = ArgumentCaptor.forClass(TextMessage.class);
        verify(viewer1, atLeastOnce()).sendMessage(captor1.capture());
        assertTrue(
                captor1.getAllValues().stream().anyMatch(msg -> msg.getPayload().contains("\"session-ended\"")),
                "Viewer 1 should receive session-ended notification"
        );

        ArgumentCaptor<TextMessage> captor2 = ArgumentCaptor.forClass(TextMessage.class);
        verify(viewer2, atLeastOnce()).sendMessage(captor2.capture());
        assertTrue(
                captor2.getAllValues().stream().anyMatch(msg -> msg.getPayload().contains("\"session-ended\"")),
                "Viewer 2 should receive session-ended notification"
        );
    }

    @Test
    void broadcasterDisconnect_sessionEndedContainsCorrectFields() throws Exception {
        WebSocketSession broadcaster = createMockSession("session-broadcaster");
        WebSocketSession viewer = createMockSession("session-viewer");

        handler.afterConnectionEstablished(broadcaster);
        handler.afterConnectionEstablished(viewer);

        joinRoom(broadcaster, "room-42", "broadcaster", "teacher-1");
        joinRoom(viewer, "room-42", "viewer", "student-1");

        clearInvocations(viewer);

        handler.afterConnectionClosed(broadcaster, CloseStatus.NORMAL);

        ArgumentCaptor<TextMessage> captor = ArgumentCaptor.forClass(TextMessage.class);
        verify(viewer, atLeastOnce()).sendMessage(captor.capture());

        String sessionEndedPayload = captor.getAllValues().stream()
                .map(TextMessage::getPayload)
                .filter(p -> p.contains("\"session-ended\""))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No session-ended message found"));

        JsonNode node = objectMapper.readTree(sessionEndedPayload);
        assertEquals("session-ended", node.get("type").asText());
        assertEquals("room-42", node.get("roomId").asText());
        assertEquals("host-left", node.get("reason").asText());
    }

    @Test
    void viewerDisconnect_doesNotSendSessionEnded() throws Exception {
        WebSocketSession broadcaster = createMockSession("session-broadcaster");
        WebSocketSession viewer = createMockSession("session-viewer");

        handler.afterConnectionEstablished(broadcaster);
        handler.afterConnectionEstablished(viewer);

        joinRoom(broadcaster, "room-1", "broadcaster", "teacher-1");
        joinRoom(viewer, "room-1", "viewer", "student-1");

        clearInvocations(broadcaster);

        // Act: viewer disconnects
        handler.afterConnectionClosed(viewer, CloseStatus.NORMAL);

        // Assert: broadcaster did NOT receive session-ended
        ArgumentCaptor<TextMessage> captor = ArgumentCaptor.forClass(TextMessage.class);
        // Broadcaster may or may not receive other notifications
        if (mockingDetails(broadcaster).getInvocations().stream()
                .anyMatch(inv -> inv.getMethod().getName().equals("sendMessage"))) {
            verify(broadcaster, atLeastOnce()).sendMessage(captor.capture());
            boolean receivedSessionEnded = captor.getAllValues().stream()
                    .anyMatch(msg -> msg.getPayload().contains("\"session-ended\""));
            assertFalse(receivedSessionEnded, "Broadcaster should NOT receive session-ended when viewer disconnects");
        }
        // If no messages at all, that's also correct
    }

    // ===== Explicit session-ended message from broadcaster =====

    @Test
    void broadcasterSendsSessionEnded_broadcastsToViewers() throws Exception {
        WebSocketSession broadcaster = createMockSession("session-broadcaster");
        WebSocketSession viewer = createMockSession("session-viewer");

        handler.afterConnectionEstablished(broadcaster);
        handler.afterConnectionEstablished(viewer);

        joinRoom(broadcaster, "room-1", "broadcaster", "teacher-1");
        joinRoom(viewer, "room-1", "viewer", "student-1");

        clearInvocations(viewer, broadcaster);

        // Act: broadcaster sends explicit session-ended
        String message = objectMapper.writeValueAsString(Map.of(
                "type", "session-ended",
                "roomId", "room-1",
                "requestId", "req-end"
        ));
        handler.handleTextMessage(broadcaster, new TextMessage(message));

        // Assert: viewer received session-ended
        ArgumentCaptor<TextMessage> viewerCaptor = ArgumentCaptor.forClass(TextMessage.class);
        verify(viewer, atLeastOnce()).sendMessage(viewerCaptor.capture());
        assertTrue(
                viewerCaptor.getAllValues().stream().anyMatch(msg -> msg.getPayload().contains("\"session-ended\"")),
                "Viewer should receive session-ended notification"
        );

        // Assert: broadcaster received ack
        ArgumentCaptor<TextMessage> broadcasterCaptor = ArgumentCaptor.forClass(TextMessage.class);
        verify(broadcaster, atLeastOnce()).sendMessage(broadcasterCaptor.capture());
        assertTrue(
                broadcasterCaptor.getAllValues().stream().anyMatch(msg -> msg.getPayload().contains("\"session-ended-ack\"")),
                "Broadcaster should receive session-ended-ack"
        );
    }

    @Test
    void viewerSendsSessionEnded_isRejected() throws Exception {
        WebSocketSession broadcaster = createMockSession("session-broadcaster");
        WebSocketSession viewer = createMockSession("session-viewer");

        handler.afterConnectionEstablished(broadcaster);
        handler.afterConnectionEstablished(viewer);

        joinRoom(broadcaster, "room-1", "broadcaster", "teacher-1");
        joinRoom(viewer, "room-1", "viewer", "student-1");

        clearInvocations(broadcaster, viewer);

        // Act: viewer tries to send session-ended
        String message = objectMapper.writeValueAsString(Map.of(
                "type", "session-ended",
                "roomId", "room-1",
                "requestId", "req-end"
        ));
        handler.handleTextMessage(viewer, new TextMessage(message));

        // Assert: broadcaster did NOT receive session-ended
        if (mockingDetails(broadcaster).getInvocations().stream()
                .anyMatch(inv -> inv.getMethod().getName().equals("sendMessage"))) {
            ArgumentCaptor<TextMessage> captor = ArgumentCaptor.forClass(TextMessage.class);
            verify(broadcaster, atLeastOnce()).sendMessage(captor.capture());
            boolean receivedSessionEnded = captor.getAllValues().stream()
                    .anyMatch(msg -> msg.getPayload().contains("\"session-ended\"")
                            && !msg.getPayload().contains("session-ended-ack"));
            assertFalse(receivedSessionEnded, "Broadcaster should NOT receive session-ended from a viewer");
        }
    }

    // ===== Cleanup =====

    @Test
    void afterDisconnect_doubleDisconnectDoesNotThrow() throws Exception {
        WebSocketSession session = createMockSession("session-1");
        handler.afterConnectionEstablished(session);
        joinRoom(session, "room-1", "viewer", "user-1");

        handler.afterConnectionClosed(session, CloseStatus.NORMAL);
        assertDoesNotThrow(() -> handler.afterConnectionClosed(session, CloseStatus.NORMAL));
    }
}
