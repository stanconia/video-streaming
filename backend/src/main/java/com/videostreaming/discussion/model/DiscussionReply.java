package com.videostreaming.discussion.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "discussion_replies")
public class DiscussionReply {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String threadId;

    @Column(nullable = false)
    private String authorUserId;

    @Column(nullable = false, length = 5000)
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public DiscussionReply() {}

    public DiscussionReply(String id, String threadId, String authorUserId, String content,
                           LocalDateTime createdAt) {
        this.id = id;
        this.threadId = threadId;
        this.authorUserId = authorUserId;
        this.content = content;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getThreadId() { return threadId; }
    public void setThreadId(String threadId) { this.threadId = threadId; }

    public String getAuthorUserId() { return authorUserId; }
    public void setAuthorUserId(String authorUserId) { this.authorUserId = authorUserId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static DiscussionReplyBuilder builder() {
        return new DiscussionReplyBuilder();
    }

    public static class DiscussionReplyBuilder {
        private String id;
        private String threadId;
        private String authorUserId;
        private String content;
        private LocalDateTime createdAt;

        public DiscussionReplyBuilder id(String id) { this.id = id; return this; }
        public DiscussionReplyBuilder threadId(String threadId) { this.threadId = threadId; return this; }
        public DiscussionReplyBuilder authorUserId(String authorUserId) { this.authorUserId = authorUserId; return this; }
        public DiscussionReplyBuilder content(String content) { this.content = content; return this; }
        public DiscussionReplyBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public DiscussionReply build() {
            return new DiscussionReply(id, threadId, authorUserId, content, createdAt);
        }
    }
}
