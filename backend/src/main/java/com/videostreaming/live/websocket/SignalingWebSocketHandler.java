package com.videostreaming.live.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.videostreaming.ai.service.AiCompanionService;
import com.videostreaming.live.service.MediaServerClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SignalingWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(SignalingWebSocketHandler.class);

    private final ObjectMapper objectMapper;
    private final MediaServerClient mediaServerClient;
    private final AiCompanionService aiCompanionService;
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, String> sessionRoomMap = new ConcurrentHashMap<>();
    private final Map<String, String> sessionRoleMap = new ConcurrentHashMap<>();
    private final Map<String, String> sessionUserIdMap = new ConcurrentHashMap<>();
    private final Map<String, String> sessionDisplayNameMap = new ConcurrentHashMap<>();

    // Tier 2: Interactive classroom state
    private final Map<String, Set<String>> roomRaisedHands = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> roomTimers = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> roomPolls = new ConcurrentHashMap<>();
    private final Map<String, Boolean> roomWhiteboardActive = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> roomWhiteboardDrawers = new ConcurrentHashMap<>();
    private final Map<String, BreakoutState> roomBreakouts = new ConcurrentHashMap<>();

    // Breakout room secondary maps
    private final Map<String, String> sessionMainRoomMap = new ConcurrentHashMap<>();
    private final Map<String, String> sessionBreakoutRoomMap = new ConcurrentHashMap<>();

    // AI Companion: chat history buffer per room (capped at 200 messages)
    private final Map<String, List<Map<String, Object>>> roomChatHistory = new ConcurrentHashMap<>();
    private static final int MAX_CHAT_HISTORY = 200;

    // Inner class for breakout state
    static class BreakoutState {
        String mainRoomId;
        List<Map<String, String>> rooms = new ArrayList<>(); // [{id, name}]
        Map<String, String> assignments = new ConcurrentHashMap<>(); // userId -> breakoutRoomId
        int durationMinutes;
        boolean isActive;
        Timer endTimer;
    }

    public SignalingWebSocketHandler(ObjectMapper objectMapper, MediaServerClient mediaServerClient, AiCompanionService aiCompanionService) {
        this.objectMapper = objectMapper;
        this.mediaServerClient = mediaServerClient;
        this.aiCompanionService = aiCompanionService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String authenticatedUserId = (String) session.getAttributes().get("userId");
        String displayName = (String) session.getAttributes().get("displayName");
        logger.info("WebSocket connection established: {} (authenticated user: {}, displayName: {})",
                session.getId(), authenticatedUserId, displayName);
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

                // Prefer authenticated userId from handshake over client-provided value
                String authenticatedUserId = (String) session.getAttributes().get("userId");
                if (authenticatedUserId != null && !authenticatedUserId.isBlank()) {
                    joinUserId = authenticatedUserId;
                }

                sessionRoomMap.put(session.getId(), roomId);
                sessionRoleMap.put(session.getId(), role);
                sessionUserIdMap.put(session.getId(), joinUserId);

                // Store display name from JWT
                String displayName = (String) session.getAttributes().get("displayName");
                if (displayName != null && !displayName.isBlank()) {
                    sessionDisplayNameMap.put(session.getId(), displayName);
                }

                logger.info("Session {} joined room {} as {} (userId: {}, displayName: {})", session.getId(), roomId, role, joinUserId, displayName);

                // Send current whiteboard state to late joiners
                if (roomWhiteboardActive.getOrDefault(roomId, false)) {
                    try {
                        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                                Map.of("type", "whiteboard-toggled", "active", true))));
                    } catch (Exception e) {
                        logger.error("Error sending whiteboard state to new joiner: {}", e.getMessage());
                    }
                }
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

            // Handle screen-share-request (viewer requests permission from host)
            if ("screen-share-request".equals(messageType)) {
                handleScreenShareRequest(session, messageNode, requestId);
                return;
            }

            // Handle screen-share-response (host approves/denies viewer request)
            if ("screen-share-response".equals(messageType)) {
                handleScreenShareResponse(session, messageNode, requestId);
                return;
            }

            // Handle stop-screen-share (host force-stops a viewer's share)
            if ("stop-screen-share".equals(messageType)) {
                handleStopScreenShare(session, messageNode, requestId);
                return;
            }

            // Handle screen-share-status-update (user broadcasts screen share status)
            if ("screen-share-status-update".equals(messageType)) {
                handleScreenShareStatusUpdate(session, messageNode, requestId);
                return;
            }

            // Handle session-ended (broadcaster ending the session for all participants)
            if ("session-ended".equals(messageType)) {
                handleSessionEnded(session, messageNode, requestId);
                return;
            }

            // AI Companion
            if ("send-ai-chat-message".equals(messageType)) {
                handleAiChatMessage(session, messageNode, requestId);
                return;
            }
            if ("request-session-summary".equals(messageType)) {
                handleSessionSummaryRequest(session, messageNode, requestId);
                return;
            }

            // Tier 2: Emoji Reactions
            if ("send-reaction".equals(messageType)) { handleSendReaction(session, messageNode, requestId); return; }

            // Tier 2: Session Timer
            if ("start-timer".equals(messageType)) { handleStartTimer(session, messageNode, requestId); return; }
            if ("pause-timer".equals(messageType)) { handlePauseTimer(session, messageNode, requestId); return; }
            if ("resume-timer".equals(messageType)) { handleResumeTimer(session, messageNode, requestId); return; }
            if ("reset-timer".equals(messageType)) { handleResetTimer(session, messageNode, requestId); return; }

            // Tier 2: Hand Raise
            if ("raise-hand".equals(messageType)) { handleRaiseHand(session, messageNode, requestId); return; }
            if ("lower-hand".equals(messageType)) { handleLowerHand(session, messageNode, requestId); return; }
            if ("lower-all-hands".equals(messageType)) { handleLowerAllHands(session, messageNode, requestId); return; }

            // Tier 2: Polls
            if ("create-poll".equals(messageType)) { handleCreatePoll(session, messageNode, requestId); return; }
            if ("submit-vote".equals(messageType)) { handleSubmitVote(session, messageNode, requestId); return; }
            if ("end-poll".equals(messageType)) { handleEndPoll(session, messageNode, requestId); return; }

            // Tier 2: File Sharing
            if ("share-file".equals(messageType)) { handleShareFile(session, messageNode, requestId); return; }

            // Tier 2: Whiteboard
            if ("whiteboard-toggle".equals(messageType)) { handleWhiteboardToggle(session, messageNode, requestId); return; }
            if ("whiteboard-update".equals(messageType)) { handleWhiteboardUpdate(session, messageNode, requestId); return; }
            if ("whiteboard-grant-draw".equals(messageType)) { handleWhiteboardGrantDraw(session, messageNode, requestId); return; }
            if ("whiteboard-revoke-draw".equals(messageType)) { handleWhiteboardRevokeDraw(session, messageNode, requestId); return; }
            if ("whiteboard-snapshot".equals(messageType)) { handleWhiteboardSnapshot(session, messageNode, requestId); return; }

            // Tier 2: Breakout Rooms
            if ("create-breakout-rooms".equals(messageType)) { handleCreateBreakoutRooms(session, messageNode, requestId); return; }
            if ("assign-breakout".equals(messageType)) { handleAssignBreakout(session, messageNode, requestId); return; }
            if ("join-breakout".equals(messageType)) { handleJoinBreakout(session, messageNode, requestId); return; }
            if ("leave-breakout".equals(messageType)) { handleLeaveBreakout(session, messageNode, requestId); return; }
            if ("end-breakout-rooms".equals(messageType)) { handleEndBreakoutRooms(session, messageNode, requestId); return; }

            // Forward message to media server and get response
            String response = mediaServerClient.forwardSignalingMessage(payload, session.getId());
            logger.info(">>> Media server response for {}: {}", messageType, response);

            // Send response back to client
            if (response != null && !response.isEmpty()) {
                // Enrich room-joined response with display names for existing producers
                if ("join-room".equals(messageType)) {
                    response = enrichRoomJoinedResponse(response);
                }
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
                        // Enrich new-producer notifications with displayName
                        String notificationType = notification.has("type") ? notification.get("type").asText() : "";
                        String notificationStr;
                        if ("new-producer".equals(notificationType)) {
                            Map<String, Object> enriched = objectMapper.convertValue(notification, Map.class);
                            String dn = sessionDisplayNameMap.get(session.getId());
                            if (dn != null) enriched.put("displayName", dn);
                            notificationStr = objectMapper.writeValueAsString(enriched);
                        } else {
                            notificationStr = objectMapper.writeValueAsString(notification);
                        }
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
        String disconnectedRole = sessionRoleMap.get(session.getId());
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

            // If the broadcaster disconnected, end the session for all participants
            if ("broadcaster".equals(disconnectedRole)) {
                try {
                    String sessionEndedNotification = objectMapper.writeValueAsString(Map.of(
                            "type", "session-ended",
                            "roomId", roomId,
                            "reason", "host-left"
                    ));
                    broadcastToRoom(roomId, sessionEndedNotification, session.getId());
                    logger.info("Broadcaster left room {}, broadcasting session-ended to all participants", roomId);
                } catch (Exception e) {
                    logger.error("Error broadcasting session-ended: {}", e.getMessage());
                }
            }
        }

        // Clean up raised hand on disconnect
        String disconnectedUserId = sessionUserIdMap.get(session.getId());
        if (roomId != null && disconnectedUserId != null) {
            Set<String> hands = roomRaisedHands.get(roomId);
            if (hands != null && hands.remove(disconnectedUserId)) {
                try {
                    String notification = objectMapper.writeValueAsString(Map.of(
                            "type", "hand-lowered", "userId", disconnectedUserId));
                    broadcastToRoom(roomId, notification, session.getId());
                } catch (Exception e) {
                    logger.error("Error broadcasting hand-lowered on disconnect: {}", e.getMessage());
                }
            }
        }

        sessions.remove(session.getId());
        sessionRoomMap.remove(session.getId());
        sessionRoleMap.remove(session.getId());
        sessionUserIdMap.remove(session.getId());
        sessionDisplayNameMap.remove(session.getId());
        sessionMainRoomMap.remove(session.getId());
        sessionBreakoutRoomMap.remove(session.getId());
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

    private String enrichRoomJoinedResponse(String response) {
        try {
            JsonNode responseNode = objectMapper.readTree(response);
            if (!responseNode.has("existingProducers")) return response;

            JsonNode producers = responseNode.get("existingProducers");
            if (!producers.isArray() || producers.size() == 0) return response;

            List<Map<String, Object>> enrichedProducers = new ArrayList<>();
            for (JsonNode producer : producers) {
                Map<String, Object> enriched = objectMapper.convertValue(producer, Map.class);
                String producerUserId = producer.has("userId") ? producer.get("userId").asText() : null;
                if (producerUserId != null) {
                    // Find displayName by looking up sessions with this userId
                    for (Map.Entry<String, String> entry : sessionUserIdMap.entrySet()) {
                        if (producerUserId.equals(entry.getValue())) {
                            String dn = sessionDisplayNameMap.get(entry.getKey());
                            if (dn != null) {
                                enriched.put("displayName", dn);
                                break;
                            }
                        }
                    }
                }
                enrichedProducers.add(enriched);
            }

            Map<String, Object> enrichedResponse = objectMapper.convertValue(responseNode, Map.class);
            enrichedResponse.put("existingProducers", enrichedProducers);
            return objectMapper.writeValueAsString(enrichedResponse);
        } catch (Exception e) {
            logger.error("Error enriching room-joined response: {}", e.getMessage());
            return response;
        }
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
            String senderName = sessionDisplayNameMap.getOrDefault(session.getId(),
                    sessionUserIdMap.getOrDefault(session.getId(), chatUserId));

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

            // Buffer message for AI context
            roomChatHistory.computeIfAbsent(roomId, k -> Collections.synchronizedList(new ArrayList<>()));
            List<Map<String, Object>> history = roomChatHistory.get(roomId);
            history.add(Map.of("senderName", senderName, "senderRole", senderRole, "content", content, "timestamp", timestamp));
            if (history.size() > MAX_CHAT_HISTORY) history.remove(0);

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

    private void handleScreenShareRequest(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String requestingUserId = messageNode.get("userId").asText();

            // Validate room membership
            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) {
                sendErrorMessage(session, "Not a member of this room");
                return;
            }

            // Forward as notification to broadcaster only
            Map<String, Object> notification = Map.of(
                    "type", "screen-share-request-notification",
                    "userId", requestingUserId
            );
            String notificationJson = objectMapper.writeValueAsString(notification);

            // Find the broadcaster session and send only to them
            sessionRoomMap.forEach((sessionId, sessionRoomId) -> {
                if (sessionRoomId.equals(roomId) && "broadcaster".equals(sessionRoleMap.get(sessionId))) {
                    sendMessageToSession(sessionId, notificationJson);
                }
            });

            // Send ack to sender
            if (requestId != null) {
                Map<String, Object> ack = Map.of(
                        "type", "screen-share-request-ack",
                        "requestId", requestId,
                        "success", true
                );
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(ack)));
            }

            logger.info("Screen share request from {} in room {}", requestingUserId, roomId);

        } catch (Exception e) {
            logger.error("Error handling screen-share-request: {}", e.getMessage());
            sendErrorMessage(session, "Failed to process screen share request");
        }
    }

    private void handleScreenShareResponse(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String targetUserId = messageNode.get("targetUserId").asText();
            boolean approved = messageNode.get("approved").asBoolean();

            // Validate sender is broadcaster
            String sessionRoom = sessionRoomMap.get(session.getId());
            String senderRole = sessionRoleMap.get(session.getId());

            if (!roomId.equals(sessionRoom)) {
                sendErrorMessage(session, "Not a member of this room");
                return;
            }

            if (!"broadcaster".equals(senderRole)) {
                sendErrorMessage(session, "Only broadcasters can respond to screen share requests");
                return;
            }

            // Forward permission to the requesting viewer
            Map<String, Object> notification = Map.of(
                    "type", "screen-share-permission",
                    "approved", approved
            );
            String notificationJson = objectMapper.writeValueAsString(notification);

            // Find the target user's session and send to them
            sessionRoomMap.forEach((sessionId, sessionRoomId) -> {
                if (sessionRoomId.equals(roomId) && targetUserId.equals(sessionUserIdMap.get(sessionId))) {
                    sendMessageToSession(sessionId, notificationJson);
                }
            });

            // Send ack to sender
            if (requestId != null) {
                Map<String, Object> ack = Map.of(
                        "type", "screen-share-response-ack",
                        "requestId", requestId,
                        "success", true
                );
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(ack)));
            }

            logger.info("Screen share response for {} in room {}: approved={}", targetUserId, roomId, approved);

        } catch (Exception e) {
            logger.error("Error handling screen-share-response: {}", e.getMessage());
            sendErrorMessage(session, "Failed to process screen share response");
        }
    }

    private void handleStopScreenShare(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String targetUserId = messageNode.get("targetUserId").asText();

            // Validate sender is broadcaster
            String sessionRoom = sessionRoomMap.get(session.getId());
            String senderRole = sessionRoleMap.get(session.getId());

            if (!roomId.equals(sessionRoom)) {
                sendErrorMessage(session, "Not a member of this room");
                return;
            }

            if (!"broadcaster".equals(senderRole)) {
                sendErrorMessage(session, "Only broadcasters can force-stop screen shares");
                return;
            }

            // Forward stop notification to the target user
            Map<String, Object> notification = Map.of(
                    "type", "screen-share-stopped"
            );
            String notificationJson = objectMapper.writeValueAsString(notification);

            // Find the target user's session and send to them
            sessionRoomMap.forEach((sessionId, sessionRoomId) -> {
                if (sessionRoomId.equals(roomId) && targetUserId.equals(sessionUserIdMap.get(sessionId))) {
                    sendMessageToSession(sessionId, notificationJson);
                }
            });

            // Send ack to sender
            if (requestId != null) {
                Map<String, Object> ack = Map.of(
                        "type", "stop-screen-share-ack",
                        "requestId", requestId,
                        "success", true
                );
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(ack)));
            }

            logger.info("Force stop screen share for {} in room {}", targetUserId, roomId);

        } catch (Exception e) {
            logger.error("Error handling stop-screen-share: {}", e.getMessage());
            sendErrorMessage(session, "Failed to process stop screen share");
        }
    }

    private void handleScreenShareStatusUpdate(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String sharingUserId = messageNode.get("userId").asText();
            boolean active = messageNode.get("active").asBoolean();

            // Validate room membership
            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) {
                sendErrorMessage(session, "Not a member of this room");
                return;
            }

            // Broadcast screen share status to all room members except sender
            Map<String, Object> notification = Map.of(
                    "type", "screen-share-status",
                    "userId", sharingUserId,
                    "active", active
            );
            String notificationJson = objectMapper.writeValueAsString(notification);
            broadcastToRoom(roomId, notificationJson, session.getId());

            // Send ack to sender
            if (requestId != null) {
                Map<String, Object> ack = Map.of(
                        "type", "screen-share-status-update-ack",
                        "requestId", requestId,
                        "success", true
                );
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(ack)));
            }

            logger.info("Screen share status update from {} in room {}: active={}", sharingUserId, roomId, active);

        } catch (Exception e) {
            logger.error("Error handling screen-share-status-update: {}", e.getMessage());
            sendErrorMessage(session, "Failed to process screen share status update");
        }
    }

    public void broadcastToRoomIncludingSender(String roomId, String message) {
        sessionRoomMap.forEach((sessionId, sessionRoomId) -> {
            if (sessionRoomId.equals(roomId)) {
                sendMessageToSession(sessionId, message);
            }
        });
    }

    public void broadcastRecordingStatus(String roomId, boolean isRecording) {
        try {
            Map<String, Object> notification = Map.of(
                    "type", "recording-status-changed",
                    "roomId", roomId,
                    "isRecording", isRecording
            );
            String notificationJson = objectMapper.writeValueAsString(notification);
            broadcastToRoomIncludingSender(roomId, notificationJson);
            logger.info("Broadcast recording status for room {}: isRecording={}", roomId, isRecording);
        } catch (Exception e) {
            logger.error("Error broadcasting recording status for room {}: {}", roomId, e.getMessage());
        }
    }

    // ==================== SESSION ENDED ====================

    private void handleSessionEnded(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can end session"); return; }

            String notification = objectMapper.writeValueAsString(Map.of(
                    "type", "session-ended",
                    "roomId", roomId,
                    "reason", "host-ended"
            ));
            broadcastToRoom(roomId, notification, session.getId());
            logger.info("Broadcaster explicitly ended session in room {}", roomId);

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "session-ended-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling session-ended: {}", e.getMessage());
            sendErrorMessage(session, "Failed to end session");
        }
    }

    // ==================== AI COMPANION ====================

    private void handleAiChatMessage(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String question = messageNode.get("question").asText();
            String chatUserId = sessionUserIdMap.getOrDefault(session.getId(), "anonymous");
            String senderName = sessionDisplayNameMap.getOrDefault(session.getId(), chatUserId);

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }

            // Broadcast the user's question as a regular chat message with isAiQuery flag
            String questionMessageId = java.util.UUID.randomUUID().toString();
            Map<String, Object> questionNotification = new HashMap<>();
            questionNotification.put("type", "chat-message");
            questionNotification.put("messageId", questionMessageId);
            questionNotification.put("roomId", roomId);
            questionNotification.put("senderId", chatUserId);
            questionNotification.put("senderName", senderName);
            questionNotification.put("senderRole", sessionRoleMap.getOrDefault(session.getId(), "viewer"));
            questionNotification.put("content", "@ai " + question);
            questionNotification.put("timestamp", Instant.now().toString());
            questionNotification.put("isAiQuery", true);
            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(questionNotification));

            // Buffer the question
            roomChatHistory.computeIfAbsent(roomId, k -> Collections.synchronizedList(new ArrayList<>()));
            roomChatHistory.get(roomId).add(Map.of("senderName", senderName, "senderRole", "viewer", "content", "@ai " + question));

            // Send ack
            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "send-ai-chat-message-ack", "requestId", requestId, "success", true))));
            }

            // Broadcast "AI is thinking" indicator
            String aiMessageId = java.util.UUID.randomUUID().toString();
            Map<String, Object> thinkingNotification = new HashMap<>();
            thinkingNotification.put("type", "ai-chat-message-start");
            thinkingNotification.put("messageId", aiMessageId);
            thinkingNotification.put("roomId", roomId);
            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(thinkingNotification));

            // Call AI and stream response chunks
            List<Map<String, Object>> history = roomChatHistory.getOrDefault(roomId, List.of());
            StringBuilder fullResponse = new StringBuilder();

            aiCompanionService.handleChatQuestion(question, history)
                    .buffer(3) // batch every 3 tokens for efficiency
                    .subscribe(
                            chunks -> {
                                try {
                                    String combined = String.join("", chunks);
                                    fullResponse.append(combined);
                                    Map<String, Object> chunkNotification = Map.of(
                                            "type", "ai-chat-message-chunk",
                                            "messageId", aiMessageId,
                                            "roomId", roomId,
                                            "chunk", combined
                                    );
                                    broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(chunkNotification));
                                } catch (Exception e) {
                                    logger.error("Error broadcasting AI chunk: {}", e.getMessage());
                                }
                            },
                            error -> {
                                logger.error("AI streaming error: {}", error.getMessage());
                                try {
                                    Map<String, Object> errorNotification = Map.of(
                                            "type", "ai-chat-message-complete",
                                            "messageId", aiMessageId,
                                            "roomId", roomId,
                                            "fullContent", "[AI encountered an error: " + error.getMessage() + "]"
                                    );
                                    broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(errorNotification));
                                } catch (Exception e2) {
                                    logger.error("Error sending AI error notification: {}", e2.getMessage());
                                }
                            },
                            () -> {
                                try {
                                    String content = fullResponse.toString();
                                    Map<String, Object> completeNotification = Map.of(
                                            "type", "ai-chat-message-complete",
                                            "messageId", aiMessageId,
                                            "roomId", roomId,
                                            "fullContent", content
                                    );
                                    broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(completeNotification));

                                    // Buffer AI response
                                    roomChatHistory.get(roomId).add(Map.of("senderName", "AI Assistant", "senderRole", "ai", "content", content));
                                    logger.info("AI response complete for room {}: {} chars", roomId, content.length());
                                } catch (Exception e) {
                                    logger.error("Error sending AI complete notification: {}", e.getMessage());
                                }
                            }
                    );

        } catch (Exception e) {
            logger.error("Error handling AI chat message: {}", e.getMessage());
            sendErrorMessage(session, "Failed to process AI message");
        }
    }

    private void handleSessionSummaryRequest(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }

            List<Map<String, Object>> history = roomChatHistory.getOrDefault(roomId, List.of());

            if (history.isEmpty()) {
                if (requestId != null) {
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                            Map.of("type", "session-summary", "roomId", roomId, "summary", "No chat messages to summarize.", "requestId", requestId))));
                }
                return;
            }

            // Broadcast "generating summary" indicator
            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(
                    Map.of("type", "ai-summary-generating", "roomId", roomId)));

            aiCompanionService.generateSummary(history)
                    .subscribe(
                            summary -> {
                                try {
                                    Map<String, Object> summaryNotification = new HashMap<>();
                                    summaryNotification.put("type", "session-summary");
                                    summaryNotification.put("roomId", roomId);
                                    summaryNotification.put("summary", summary);
                                    if (requestId != null) summaryNotification.put("requestId", requestId);
                                    broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(summaryNotification));
                                    logger.info("Session summary generated for room {}", roomId);
                                } catch (Exception e) {
                                    logger.error("Error broadcasting summary: {}", e.getMessage());
                                }
                            },
                            error -> {
                                logger.error("Summary generation error: {}", error.getMessage());
                                try {
                                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                                            Map.of("type", "session-summary", "roomId", roomId, "summary", "Failed to generate summary: " + error.getMessage()))));
                                } catch (Exception e2) {
                                    logger.error("Error sending summary error: {}", e2.getMessage());
                                }
                            }
                    );

        } catch (Exception e) {
            logger.error("Error handling session summary request: {}", e.getMessage());
            sendErrorMessage(session, "Failed to generate summary");
        }
    }

    // ==================== TIER 2: EMOJI REACTIONS ====================

    private void handleSendReaction(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String userId = sessionUserIdMap.getOrDefault(session.getId(), "anonymous");
            String emoji = messageNode.get("emoji").asText();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }

            Map<String, Object> notification = Map.of(
                    "type", "reaction", "userId", userId, "emoji", emoji,
                    "timestamp", Instant.now().toString());
            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(notification));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "send-reaction-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling reaction: {}", e.getMessage());
            sendErrorMessage(session, "Failed to send reaction");
        }
    }

    // ==================== TIER 2: SESSION TIMER ====================

    private void handleStartTimer(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            int durationSeconds = messageNode.get("durationSeconds").asInt();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can control timer"); return; }

            Map<String, Object> timerState = new HashMap<>();
            timerState.put("durationSeconds", durationSeconds);
            timerState.put("startedAt", System.currentTimeMillis());
            roomTimers.put(roomId, timerState);

            Map<String, Object> notification = Map.of(
                    "type", "timer-started", "durationSeconds", durationSeconds,
                    "serverTimestamp", Instant.now().toString());
            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(notification));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "start-timer-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling start-timer: {}", e.getMessage());
            sendErrorMessage(session, "Failed to start timer");
        }
    }

    private void handlePauseTimer(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can control timer"); return; }

            Map<String, Object> timerState = roomTimers.get(roomId);
            if (timerState == null) { sendErrorMessage(session, "No active timer"); return; }

            long elapsed = (System.currentTimeMillis() - (long) timerState.get("startedAt")) / 1000;
            int remaining = Math.max(0, (int) timerState.get("durationSeconds") - (int) elapsed);
            timerState.put("pausedRemaining", remaining);

            Map<String, Object> notification = Map.of("type", "timer-paused", "remainingSeconds", remaining);
            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(notification));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "pause-timer-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling pause-timer: {}", e.getMessage());
            sendErrorMessage(session, "Failed to pause timer");
        }
    }

    private void handleResumeTimer(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can control timer"); return; }

            Map<String, Object> timerState = roomTimers.get(roomId);
            if (timerState == null || !timerState.containsKey("pausedRemaining")) { sendErrorMessage(session, "No paused timer"); return; }

            int remaining = (int) timerState.get("pausedRemaining");
            timerState.put("durationSeconds", remaining);
            timerState.put("startedAt", System.currentTimeMillis());
            timerState.remove("pausedRemaining");

            Map<String, Object> notification = Map.of(
                    "type", "timer-resumed", "remainingSeconds", remaining,
                    "serverTimestamp", Instant.now().toString());
            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(notification));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "resume-timer-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling resume-timer: {}", e.getMessage());
            sendErrorMessage(session, "Failed to resume timer");
        }
    }

    private void handleResetTimer(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can control timer"); return; }

            roomTimers.remove(roomId);

            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(Map.of("type", "timer-reset")));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "reset-timer-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling reset-timer: {}", e.getMessage());
            sendErrorMessage(session, "Failed to reset timer");
        }
    }

    // ==================== TIER 2: HAND RAISE ====================

    private void handleRaiseHand(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String userId = sessionUserIdMap.getOrDefault(session.getId(), "anonymous");

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }

            roomRaisedHands.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(userId);

            Map<String, Object> notification = Map.of("type", "hand-raised", "userId", userId, "userName", userId);
            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(notification));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "raise-hand-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling raise-hand: {}", e.getMessage());
            sendErrorMessage(session, "Failed to raise hand");
        }
    }

    private void handleLowerHand(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String targetUserId = messageNode.get("targetUserId").asText();
            String senderId = sessionUserIdMap.getOrDefault(session.getId(), "anonymous");
            String senderRole = sessionRoleMap.get(session.getId());

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }

            // Viewers can only lower their own hand
            if (!"broadcaster".equals(senderRole) && !targetUserId.equals(senderId)) {
                sendErrorMessage(session, "Only broadcaster can lower others' hands"); return;
            }

            Set<String> hands = roomRaisedHands.get(roomId);
            if (hands != null) hands.remove(targetUserId);

            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(
                    Map.of("type", "hand-lowered", "userId", targetUserId)));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "lower-hand-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling lower-hand: {}", e.getMessage());
            sendErrorMessage(session, "Failed to lower hand");
        }
    }

    private void handleLowerAllHands(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can lower all hands"); return; }

            roomRaisedHands.remove(roomId);

            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(
                    Map.of("type", "all-hands-lowered")));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "lower-all-hands-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling lower-all-hands: {}", e.getMessage());
            sendErrorMessage(session, "Failed to lower all hands");
        }
    }

    // ==================== TIER 2: POLLS ====================

    @SuppressWarnings("unchecked")
    private void handleCreatePoll(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can create polls"); return; }

            String question = messageNode.get("question").asText();
            List<String> options = new ArrayList<>();
            messageNode.get("options").forEach(n -> options.add(n.asText()));

            String pollId = UUID.randomUUID().toString();
            Map<String, Object> pollState = new HashMap<>();
            pollState.put("pollId", pollId);
            pollState.put("question", question);
            pollState.put("options", options);
            Map<Integer, Integer> votes = new ConcurrentHashMap<>();
            for (int i = 0; i < options.size(); i++) votes.put(i, 0);
            pollState.put("votes", votes);
            pollState.put("voters", ConcurrentHashMap.newKeySet());
            pollState.put("isActive", true);
            roomPolls.put(roomId, pollState);

            Map<String, Object> notification = Map.of(
                    "type", "poll-created", "pollId", pollId, "question", question, "options", options);
            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(notification));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "create-poll-ack", "requestId", requestId, "success", true, "pollId", pollId))));
            }
        } catch (Exception e) {
            logger.error("Error handling create-poll: {}", e.getMessage());
            sendErrorMessage(session, "Failed to create poll");
        }
    }

    @SuppressWarnings("unchecked")
    private void handleSubmitVote(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String pollId = messageNode.get("pollId").asText();
            int optionIndex = messageNode.get("optionIndex").asInt();
            String voterId = sessionUserIdMap.getOrDefault(session.getId(), "anonymous");

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }

            Map<String, Object> pollState = roomPolls.get(roomId);
            if (pollState == null || !pollId.equals(pollState.get("pollId"))) { sendErrorMessage(session, "Poll not found"); return; }
            if (!(boolean) pollState.get("isActive")) { sendErrorMessage(session, "Poll has ended"); return; }

            Set<String> voters = (Set<String>) pollState.get("voters");
            if (voters.contains(voterId)) { sendErrorMessage(session, "Already voted"); return; }

            Map<Integer, Integer> votes = (Map<Integer, Integer>) pollState.get("votes");
            List<String> options = (List<String>) pollState.get("options");
            if (optionIndex < 0 || optionIndex >= options.size()) { sendErrorMessage(session, "Invalid option"); return; }

            voters.add(voterId);
            votes.merge(optionIndex, 1, Integer::sum);

            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "poll-updated");
            notification.put("pollId", pollId);
            notification.put("votes", votes);
            notification.put("totalVotes", voters.size());
            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(notification));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "submit-vote-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling submit-vote: {}", e.getMessage());
            sendErrorMessage(session, "Failed to submit vote");
        }
    }

    @SuppressWarnings("unchecked")
    private void handleEndPoll(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String pollId = messageNode.get("pollId").asText();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can end polls"); return; }

            Map<String, Object> pollState = roomPolls.get(roomId);
            if (pollState == null || !pollId.equals(pollState.get("pollId"))) { sendErrorMessage(session, "Poll not found"); return; }

            pollState.put("isActive", false);

            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "poll-ended");
            notification.put("pollId", pollId);
            Map<String, Object> finalResults = new HashMap<>();
            finalResults.put("question", pollState.get("question"));
            finalResults.put("options", pollState.get("options"));
            finalResults.put("votes", pollState.get("votes"));
            finalResults.put("totalVotes", ((Set<String>) pollState.get("voters")).size());
            notification.put("finalResults", finalResults);
            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(notification));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "end-poll-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling end-poll: {}", e.getMessage());
            sendErrorMessage(session, "Failed to end poll");
        }
    }

    // ==================== TIER 2: FILE SHARING ====================

    private void handleShareFile(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String userId = sessionUserIdMap.getOrDefault(session.getId(), "anonymous");

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }

            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "file-shared");
            notification.put("fileId", messageNode.get("fileId").asText());
            notification.put("fileName", messageNode.get("fileName").asText());
            notification.put("fileSize", messageNode.get("fileSize").asLong());
            notification.put("fileType", messageNode.get("fileType").asText());
            notification.put("downloadUrl", messageNode.get("downloadUrl").asText());
            notification.put("sharedBy", userId);
            notification.put("timestamp", Instant.now().toString());
            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(notification));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "share-file-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling share-file: {}", e.getMessage());
            sendErrorMessage(session, "Failed to share file");
        }
    }

    // ==================== TIER 2: WHITEBOARD ====================

    private void handleWhiteboardToggle(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            boolean active = messageNode.get("active").asBoolean();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can toggle whiteboard"); return; }

            roomWhiteboardActive.put(roomId, active);
            if (!active) { roomWhiteboardDrawers.remove(roomId); }

            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(
                    Map.of("type", "whiteboard-toggled", "active", active)));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "whiteboard-toggle-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling whiteboard-toggle: {}", e.getMessage());
            sendErrorMessage(session, "Failed to toggle whiteboard");
        }
    }

    private void handleWhiteboardUpdate(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String userId = sessionUserIdMap.getOrDefault(session.getId(), "anonymous");
            String role = sessionRoleMap.get(session.getId());

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }

            // Only broadcaster or granted drawers can send updates
            if (!"broadcaster".equals(role)) {
                Set<String> drawers = roomWhiteboardDrawers.get(roomId);
                if (drawers == null || !drawers.contains(userId)) { sendErrorMessage(session, "No drawing permission"); return; }
            }

            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "whiteboard-update");
            notification.put("changes", messageNode.get("changes"));
            notification.put("userId", userId);
            broadcastToRoom(roomId, objectMapper.writeValueAsString(notification), session.getId());

            // No ack needed for high-frequency updates
        } catch (Exception e) {
            logger.error("Error handling whiteboard-update: {}", e.getMessage());
        }
    }

    private void handleWhiteboardGrantDraw(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String targetUserId = messageNode.get("targetUserId").asText();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can grant draw permission"); return; }

            roomWhiteboardDrawers.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(targetUserId);

            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(
                    Map.of("type", "whiteboard-draw-permission", "targetUserId", targetUserId, "granted", true)));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "whiteboard-grant-draw-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling whiteboard-grant-draw: {}", e.getMessage());
            sendErrorMessage(session, "Failed to grant draw permission");
        }
    }

    private void handleWhiteboardRevokeDraw(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();
            String targetUserId = messageNode.get("targetUserId").asText();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can revoke draw permission"); return; }

            Set<String> drawers = roomWhiteboardDrawers.get(roomId);
            if (drawers != null) drawers.remove(targetUserId);

            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(
                    Map.of("type", "whiteboard-draw-permission", "targetUserId", targetUserId, "granted", false)));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "whiteboard-revoke-draw-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling whiteboard-revoke-draw: {}", e.getMessage());
            sendErrorMessage(session, "Failed to revoke draw permission");
        }
    }

    private void handleWhiteboardSnapshot(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can send snapshots"); return; }

            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "whiteboard-snapshot");
            notification.put("snapshot", messageNode.get("snapshot"));
            broadcastToRoom(roomId, objectMapper.writeValueAsString(notification), session.getId());

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "whiteboard-snapshot-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling whiteboard-snapshot: {}", e.getMessage());
            sendErrorMessage(session, "Failed to send snapshot");
        }
    }

    // ==================== TIER 2: BREAKOUT ROOMS ====================

    private void handleCreateBreakoutRooms(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can create breakout rooms"); return; }

            int durationMinutes = messageNode.has("durationMinutes") ? messageNode.get("durationMinutes").asInt() : 0;
            List<String> roomNames = new ArrayList<>();
            messageNode.get("roomNames").forEach(n -> roomNames.add(n.asText()));

            BreakoutState state = new BreakoutState();
            state.mainRoomId = roomId;
            state.durationMinutes = durationMinutes;
            state.isActive = true;

            for (int i = 0; i < roomNames.size(); i++) {
                Map<String, String> room = new HashMap<>();
                room.put("id", roomId + "-breakout-" + i);
                room.put("name", roomNames.get(i));
                state.rooms.add(room);
            }

            roomBreakouts.put(roomId, state);

            // Schedule auto-end if duration set
            if (durationMinutes > 0) {
                state.endTimer = new Timer();
                state.endTimer.schedule(new TimerTask() {
                    @Override
                    public void run() {
                        try {
                            endBreakoutRooms(roomId);
                        } catch (Exception e) {
                            logger.error("Error auto-ending breakout rooms: {}", e.getMessage());
                        }
                    }
                }, (long) durationMinutes * 60 * 1000);
            }

            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "breakout-rooms-created");
            notification.put("rooms", state.rooms);
            if (durationMinutes > 0) notification.put("durationMinutes", durationMinutes);
            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(notification));

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "create-breakout-rooms-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling create-breakout-rooms: {}", e.getMessage());
            sendErrorMessage(session, "Failed to create breakout rooms");
        }
    }

    private void handleAssignBreakout(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can assign breakout rooms"); return; }

            BreakoutState state = roomBreakouts.get(roomId);
            if (state == null || !state.isActive) { sendErrorMessage(session, "No active breakout rooms"); return; }

            JsonNode assignments = messageNode.get("assignments");
            assignments.fields().forEachRemaining(entry -> {
                String userId = entry.getKey();
                String breakoutRoomId = entry.getValue().asText();
                state.assignments.put(userId, breakoutRoomId);

                // Find room name
                String roomName = state.rooms.stream()
                        .filter(r -> r.get("id").equals(breakoutRoomId))
                        .map(r -> r.get("name"))
                        .findFirst().orElse("Breakout Room");

                // Send targeted notification to assigned user
                try {
                    String notification = objectMapper.writeValueAsString(
                            Map.of("type", "breakout-assigned", "breakoutRoomId", breakoutRoomId, "breakoutRoomName", roomName));
                    sessionRoomMap.forEach((sid, sRoomId) -> {
                        if (sRoomId.equals(roomId) && userId.equals(sessionUserIdMap.get(sid))) {
                            sendMessageToSession(sid, notification);
                        }
                    });
                } catch (Exception e) {
                    logger.error("Error sending breakout assignment: {}", e.getMessage());
                }
            });

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "assign-breakout-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling assign-breakout: {}", e.getMessage());
            sendErrorMessage(session, "Failed to assign breakout rooms");
        }
    }

    private void handleJoinBreakout(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String mainRoomId = messageNode.get("roomId").asText();
            String breakoutRoomId = messageNode.get("breakoutRoomId").asText();

            sessionMainRoomMap.put(session.getId(), mainRoomId);
            sessionBreakoutRoomMap.put(session.getId(), breakoutRoomId);

            // Forward join-room to media server for the breakout room
            String joinMessage = objectMapper.writeValueAsString(Map.of(
                    "type", "join-room",
                    "roomId", breakoutRoomId,
                    "userId", sessionUserIdMap.getOrDefault(session.getId(), "anonymous"),
                    "role", sessionRoleMap.getOrDefault(session.getId(), "viewer")));
            String response = mediaServerClient.forwardSignalingMessage(joinMessage, session.getId());

            if (response != null && !response.isEmpty()) {
                session.sendMessage(new TextMessage(response));
            }

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "join-breakout-ack", "requestId", requestId, "success", true,
                                "breakoutRoomId", breakoutRoomId))));
            }
        } catch (Exception e) {
            logger.error("Error handling join-breakout: {}", e.getMessage());
            sendErrorMessage(session, "Failed to join breakout room");
        }
    }

    private void handleLeaveBreakout(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String breakoutRoomId = sessionBreakoutRoomMap.get(session.getId());
            if (breakoutRoomId != null) {
                // Leave breakout room on media server
                String leaveMessage = objectMapper.writeValueAsString(Map.of(
                        "type", "leave-room", "roomId", breakoutRoomId, "sessionId", session.getId()));
                mediaServerClient.forwardSignalingMessage(leaveMessage, session.getId());
            }

            sessionBreakoutRoomMap.remove(session.getId());

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "leave-breakout-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling leave-breakout: {}", e.getMessage());
            sendErrorMessage(session, "Failed to leave breakout room");
        }
    }

    private void handleEndBreakoutRooms(WebSocketSession session, JsonNode messageNode, String requestId) {
        try {
            String roomId = messageNode.get("roomId").asText();

            String sessionRoom = sessionRoomMap.get(session.getId());
            if (!roomId.equals(sessionRoom)) { sendErrorMessage(session, "Not a member of this room"); return; }
            if (!"broadcaster".equals(sessionRoleMap.get(session.getId()))) { sendErrorMessage(session, "Only broadcaster can end breakout rooms"); return; }

            endBreakoutRooms(roomId);

            if (requestId != null) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(
                        Map.of("type", "end-breakout-rooms-ack", "requestId", requestId, "success", true))));
            }
        } catch (Exception e) {
            logger.error("Error handling end-breakout-rooms: {}", e.getMessage());
            sendErrorMessage(session, "Failed to end breakout rooms");
        }
    }

    private void endBreakoutRooms(String roomId) {
        BreakoutState state = roomBreakouts.get(roomId);
        if (state == null) return;

        state.isActive = false;
        if (state.endTimer != null) { state.endTimer.cancel(); state.endTimer = null; }

        // Broadcast end to main room
        try {
            broadcastToRoomIncludingSender(roomId, objectMapper.writeValueAsString(
                    Map.of("type", "breakout-rooms-ended")));
        } catch (Exception e) {
            logger.error("Error broadcasting breakout rooms ended: {}", e.getMessage());
        }

        // Clean up breakout room mappings
        sessionBreakoutRoomMap.entrySet().removeIf(entry -> {
            String breakoutId = entry.getValue();
            return state.rooms.stream().anyMatch(r -> r.get("id").equals(breakoutId));
        });

        roomBreakouts.remove(roomId);
    }
}
