package com.videostreaming.discussion.dto;

import java.time.LocalDateTime;

public class DiscussionReplyResponse {

    private String id;
    private String threadId;
    private String authorUserId;
    private String authorDisplayName;
    private String content;
    private LocalDateTime createdAt;

    public DiscussionReplyResponse() {}

    public DiscussionReplyResponse(String id, String threadId, String authorUserId,
                                    String authorDisplayName, String content,
                                    LocalDateTime createdAt) {
        this.id = id;
        this.threadId = threadId;
        this.authorUserId = authorUserId;
        this.authorDisplayName = authorDisplayName;
        this.content = content;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getThreadId() { return threadId; }
    public void setThreadId(String threadId) { this.threadId = threadId; }

    public String getAuthorUserId() { return authorUserId; }
    public void setAuthorUserId(String authorUserId) { this.authorUserId = authorUserId; }

    public String getAuthorDisplayName() { return authorDisplayName; }
    public void setAuthorDisplayName(String authorDisplayName) { this.authorDisplayName = authorDisplayName; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
