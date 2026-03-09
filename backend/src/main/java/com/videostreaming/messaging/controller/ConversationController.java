package com.videostreaming.messaging.controller;

import com.videostreaming.messaging.dto.ConversationResponse;
import com.videostreaming.messaging.dto.MessageResponse;
import com.videostreaming.messaging.dto.SendMessageRequest;
import com.videostreaming.messaging.service.ConversationService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getConversations(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(conversationService.getConversations(userId));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<?> getMessages(@PathVariable String id,
                                          @RequestParam(required = false, defaultValue = "0") int page,
                                          @RequestParam(required = false, defaultValue = "20") int size,
                                          Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            Page<MessageResponse> messages = conversationService.getMessages(id, userId, page, size);
            return ResponseEntity.ok(messages);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/messages")
    public ResponseEntity<?> sendMessage(@RequestBody SendMessageRequest request,
                                          Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            MessageResponse response = conversationService.sendMessage(
                    userId, request.getRecipientUserId(), request.getContent());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            conversationService.markAsRead(id, userId);
            return ResponseEntity.ok(Map.of("message", "Messages marked as read"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("count", conversationService.getUnreadCount(userId)));
    }
}
