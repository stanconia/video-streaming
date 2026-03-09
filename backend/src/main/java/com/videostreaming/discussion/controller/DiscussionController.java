package com.videostreaming.discussion.controller;

import com.videostreaming.discussion.dto.DiscussionReplyResponse;
import com.videostreaming.discussion.dto.DiscussionThreadResponse;
import com.videostreaming.discussion.service.DiscussionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses/{courseId}/discussions")
public class DiscussionController {

    private final DiscussionService discussionService;

    public DiscussionController(DiscussionService discussionService) {
        this.discussionService = discussionService;
    }

    @PostMapping
    public ResponseEntity<?> createThread(@PathVariable String courseId,
                                           @RequestBody Map<String, String> body,
                                           Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            String title = body.get("title");
            String content = body.get("content");
            DiscussionThreadResponse response = discussionService.createThread(courseId, userId, title, content);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<DiscussionThreadResponse>> getThreads(@PathVariable String courseId) {
        return ResponseEntity.ok(discussionService.getThreads(courseId));
    }

    @GetMapping("/{threadId}")
    public ResponseEntity<?> getThread(@PathVariable String courseId,
                                        @PathVariable String threadId) {
        try {
            DiscussionThreadResponse response = discussionService.getThread(threadId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{threadId}/replies")
    public ResponseEntity<?> addReply(@PathVariable String courseId,
                                       @PathVariable String threadId,
                                       @RequestBody Map<String, String> body,
                                       Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            String content = body.get("content");
            DiscussionReplyResponse response = discussionService.addReply(threadId, userId, content);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{threadId}/replies")
    public ResponseEntity<List<DiscussionReplyResponse>> getReplies(@PathVariable String courseId,
                                                                     @PathVariable String threadId) {
        return ResponseEntity.ok(discussionService.getReplies(threadId));
    }

    @DeleteMapping("/{threadId}")
    public ResponseEntity<?> deleteThread(@PathVariable String courseId,
                                           @PathVariable String threadId,
                                           Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            discussionService.deleteThread(threadId, userId);
            return ResponseEntity.ok(Map.of("message", "Thread deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<?> deleteReply(@PathVariable String courseId,
                                          @PathVariable String replyId,
                                          Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            discussionService.deleteReply(replyId, userId);
            return ResponseEntity.ok(Map.of("message", "Reply deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
