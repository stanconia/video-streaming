package com.videostreaming.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.videostreaming.service.MediaServerClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SignalingWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(SignalingWebSocketHandler.class);

    private final ObjectMapper objectMapper;
    private final MediaServerClient mediaServerClient;
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, String> sessionRoomMap = new ConcurrentHashMap<>();
    private final Map<String, String> sessionRoleMap = new ConcurrentHashMap<>();
    private final Map<String, String> sessionUserIdMap = new ConcurrentHashMap<>();

    public SignalingWebSocketHandler(ObjectMapper objectMapper, MediaServerClient mediaServerClient) {
        this.objectMapper = objectMapper;
        this.mediaServerClient = mediaServerClient;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        logger.info("WebSocket connection established: {}", session.getId());
        sessions.put(session.getId(), session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            String payload = message.getPayload();
            logger.debug("Received message from {}: {}", session.getId(), payload);

            JsonNode messageNode = objectMapper.readTree(payload);
            String messageType = messageNode.get("type").asText();
            String requestId = messageNode.has("requestId") ? messageNode.get("requestId").asText() : null;

            // Store room association if joining
            if ("join-room".equals(messageType) && messageNode.has("roomId")) {
                String roomId = messageNode.get("roomId").asText();
                String role = messageNode.has("role") ? messageNode.get("role").asText() : "viewer";
                String joinUserId = messageNode.has("userId") ? messageNode.get("userId").asText() : "anonymous";

                sessionRoomMap.put(session.getId(), roomId);
                sessionRoleMap.put(session.getId(), role);
                sessionUserIdMap.put(session.getId(), joinUserId);
                logger.info("Session {} joined room {} as {} (userId: {})", session.getId(), roomId, role, joinUserId);
            }

            // Handle chat messages directly (don't forward to media server)
            if ("send-chat-message".equals(messageType)) {
                handleChatMessage(session, messageNode, requestId);
                return;
            }

            // Handle mute-participant messages (broadcaster muting a viewer)
            if ("mute-participant".equals(messageType)) {
                handleMuteParticipant(session, messageNode, requestId);
                return;
            }

            // Handle self-mute messages (participant muting themselves)
            if ("self-mute".equals(messageType)) {
                handleSelfMute(session, messageNode, requestId);
                return;
            }

            // Handle video-toggle messages (participant toggling their video)
            if ("video-toggle".equals(messageType)) {
                handleVideoToggle(session, messageNode, requestId);
                return;
            }

            // Forward message to media server and get response
            String response = mediaServerClient.forwardSignalingMessage(payload, session.getId());
            logger.info(">>> Media server response for {}: {}", messageType, response);

            // Send response back to client
            if (response != null && !response.isEmpty()) {
                session.sendMessage(new TextMessage(response));
                logger.debug("Sent response to {}: {}", session.getId(), response);

                // Check if response contains a notification to broadcast
                JsonNode responseNode = objectMapper.readTree(response);
                logger.info(">>> Checking for notification in response, has notification: {}", responseNode.has("notification"));
                if (responseNode.has("notification")) {
                    String roomId = sessionRoomMap.get(session.getId());
                    logger.info(">>> Found notification in response, roomId={}, sessions in room: {}",
                        roomId, sessionRoomMap.entrySet().stream()
                            .filter(e -> roomId != null && roomId.equals(e.getValue()))
                            .count());
                    if (roomId != null) {
                        JsonNode notification = responseNode.get("notification");
                        String notificationStr = objectMapper.writeValueAsString(notification);
                        logger.info(">>> Broadcasting notification to room {}: {}", roomId, notificationStr);
                        broadcastToRoom(roomId, notificationStr, session.getId());
                    }
                }
            }

        } catch (Exception e) {
            logger.error("Error handling message from {}: {}", session.getId(), e.getMessage(), e);
            sendErrorMessage(session, "Error processing message: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        logger.info("WebSocket connection closed: {} with status: {}", session.getId(), status);

        String roomId = sessionRoomMap.get(session.getId());
        if (roomId != null) {
            try {
                // Notify media server about client disconnection
                String leaveMessage = objectMapper.writeValueAsString(Map.of(
                        "type", "leave-room",
                        "roomId", roomId,
                        "sessionId", session.getId()
                ));
                mediaServerClient.forwardSignalingMessage(leaveMessage, session.getId());
            } catch (Exception e) {
                logger.error("Error notifying media server of disconnection: {}", e.getMessage());
            }
        }

        sessions.remove(session.getId());
        sessionRoomMap.remove(session.getId());
        sessionRoleMap.remove(session.getId());
        sessionUserIdMap.remove(session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        logger.error("WebSocket transport error for {}: {}", session.getId(), exception.getMessage(), exception);
    }

    public void sendMessageToSession(String sessionId, String message) {
        WebSocketSession session = sessions.get(sessionId);
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(message));
                logger.debug("Sent notification to {}: {}", sessionId, message);
            } catch (IOException e) {
                logger.error("Error sending message to session {}: {}", sessionId, e.getMessage());
            }
        }
    }

    public void broadcastToRoom(String roomId, String message, String excludeSessionId) {
        sessionRoomMap.forEach((sessionId, sessionRoomId) -> {
            if (sessionRoomId.equals(roomId) && !sessionId.equals(excludeSessionId)) {
                sendMessageToSession(sessionId, message);
            }
        });
    }

    private void sendErrorMessage(WebSocketSession session, String errorMessage) {
        try {
            String errorJson = objectMapper.writeValueAsString(Map.of(
                    "type", "error",
                    "message", errorMessage
            ));
            session.sendMessage(new TextMessage(errorJson));
        } catch (IOException e) {
            logger.error("Error sending error message: {}", e.getMessage());
        }
    }

    private void handleChatMessage(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String content = messageNode.get("content").asText();
            String chatUserId = messageNode.get("userId").asText();

            // Validate room membership
            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) {
                sendErrorMessage(session, "Not a member of this room");
                return;
            }

            // Get participant info
            String senderRole = sessionRoleMap.getOrDefault(session.getId(), "viewer");
            String senderName = sessionUserIdMap.getOrDefault(session.getId(), chatUserId);

            // Create chat notification
            String messageId = java.util.UUID.randomUUID().toString();
            String timestamp = java.time.Instant.now().toString();

            Map<String, Object> chatNotification = Map.of(
                    "type", "chat-message",
                    "messageId", messageId,
                    "roomId", roomId,
                    "senderId", chatUserId,
                    "senderName", senderName,
                    "senderRole", senderRole,
                    "content", content,
                    "timestamp", timestamp
            );

            String notificationJson = objectMapper.writeValueAsString(chatNotification);

            // Broadcast to ALL room members (including sender for confirmation)
            broadcastToRoomIncludingSender(roomId, notificationJson);

            // Send acknowledgment to sender
            if (requestId != null) {
                Map<String, Object> ack = Map.of(
                        "type", "send-chat-message-ack",
                        "requestId", requestId,
                        "success", true,
                        "messageId", messageId
                );
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(ack)));
            }

            logger.info("Chat message from {} in room {}", chatUserId, roomId);

        } catch (Exception e) {
            logger.error("Error handling chat message: {}", e.getMessage());
            sendErrorMessage(session, "Failed to send chat message");
        }
    }

    private void handleMuteParticipant(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String targetUserId = messageNode.get("targetUserId").asText();
            boolean isMuted = messageNode.get("isMuted").asBoolean();

            // Validate room membership and role (only broadcasters can mute others)
            String sessionRoom = sessionRoomMap.get(session.getId());
            String senderRole = sessionRoleMap.get(session.getId());

            if (!roomId.equals(sessionRoom)) {
                sendErrorMessage(session, "Not a member of this room");
                return;
            }

            if (!"broadcaster".equals(senderRole)) {
                sendErrorMessage(session, "Only broadcasters can mute other participants");
                return;
            }

            // Create mute notification
            Map<String, Object> muteNotification = Map.of(
                    "type", "participant-muted",
                    "targetUserId", targetUserId,
                    "isMuted", isMuted
            );

            String notificationJson = objectMapper.writeValueAsString(muteNotification);

            // Broadcast to all room members (so everyone sees the mute status)
            broadcastToRoomIncludingSender(roomId, notificationJson);

            // Send acknowledgment to sender
            if (requestId != null) {
                Map<String, Object> ack = Map.of(
                        "type", "mute-participant-ack",
                        "requestId", requestId,
                        "success", true
                );
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(ack)));
            }

            logger.info("Broadcaster muted participant {} in room {}: {}", targetUserId, roomId, isMuted);

        } catch (Exception e) {
            logger.error("Error handling mute participant: {}", e.getMessage());
            sendErrorMessage(session, "Failed to mute participant");
        }
    }

    private void handleVideoToggle(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String odrive = messageNode.get("userId").asText();
            boolean isVideoOff = messageNode.get("isVideoOff").asBoolean();

            // Validate room membership
            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) {
                sendErrorMessage(session, "Not a member of this room");
                return;
            }

            // Create video toggle notification
            Map<String, Object> videoToggleNotification = Map.of(
                    "type", "participant-video-toggled",
                    "odrive", odrive,
                    "isVideoOff", isVideoOff
            );

            String notificationJson = objectMapper.writeValueAsString(videoToggleNotification);

            // Broadcast to all room members except sender
            broadcastToRoom(roomId, notificationJson, session.getId());

            // Send acknowledgment to sender
            if (requestId != null) {
                Map<String, Object> ack = Map.of(
                        "type", "video-toggle-ack",
                        "requestId", requestId,
                        "success", true
                );
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(ack)));
            }

            logger.info("Participant {} toggled video in room {}: off={}", odrive, roomId, isVideoOff);

        } catch (Exception e) {
            logger.error("Error handling video-toggle: {}", e.getMessage());
            sendErrorMessage(session, "Failed to process video-toggle");
        }
    }

    private void handleSelfMute(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String odrive = messageNode.get("userId").asText();
            boolean isMuted = messageNode.get("isMuted").asBoolean();

            // Validate room membership
            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) {
                sendErrorMessage(session, "Not a member of this room");
                return;
            }

            // Create self-mute notification
            Map<String, Object> selfMuteNotification = Map.of(
                    "type", "participant-self-muted",
                    "userId", odrive,
                    "isMuted", isMuted
            );

            String notificationJson = objectMapper.writeValueAsString(selfMuteNotification);

            // Broadcast to all room members except sender
            broadcastToRoom(roomId, notificationJson, session.getId());

            // Send acknowledgment to sender
            if (requestId != null) {
                Map<String, Object> ack = Map.of(
                        "type", "self-mute-ack",
                        "requestId", requestId,
                        "success", true
                );
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(ack)));
            }

            logger.info("Participant {} self-muted in room {}: {}", odrive, roomId, isMuted);

        } catch (Exception e) {
            logger.error("Error handling self-mute: {}", e.getMessage());
            sendErrorMessage(session, "Failed to process self-mute");
        }
    }

    public void broadcastToRoomIncludingSender(String roomId, String message) {
        sessionRoomMap.forEach((sessionId, sessionRoomId) -> {
            if (sessionRoomId.equals(roomId)) {
                sendMessageToSession(sessionId, message);
            }
        });
    }
}
