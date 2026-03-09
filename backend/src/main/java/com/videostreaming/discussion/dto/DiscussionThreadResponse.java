package com.videostreaming.discussion.dto;

import java.time.LocalDateTime;

public class DiscussionThreadResponse {

    private String id;
    private String courseId;
    private String authorUserId;
    private String authorDisplayName;
    private String title;
    private String content;
    private int replyCount;
    private LocalDateTime lastActivityAt;
    private LocalDateTime createdAt;

    public DiscussionThreadResponse() {}

    public DiscussionThreadResponse(String id, String courseId, String authorUserId,
                                     String authorDisplayName, String title, String content,
                                     int replyCount, LocalDateTime lastActivityAt,
                                     LocalDateTime createdAt) {
        this.id = id;
        this.courseId = courseId;
        this.authorUserId = authorUserId;
        this.authorDisplayName = authorDisplayName;
        this.title = title;
        this.content = content;
        this.replyCount = replyCount;
        this.lastActivityAt = lastActivityAt;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getAuthorUserId() { return authorUserId; }
    public void setAuthorUserId(String authorUserId) { this.authorUserId = authorUserId; }

    public String getAuthorDisplayName() { return authorDisplayName; }
    public void setAuthorDisplayName(String authorDisplayName) { this.authorDisplayName = authorDisplayName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public int getReplyCount() { return replyCount; }
    public void setReplyCount(int replyCount) { this.replyCount = replyCount; }

    public LocalDateTime getLastActivityAt() { return lastActivityAt; }
    public void setLastActivityAt(LocalDateTime lastActivityAt) { this.lastActivityAt = lastActivityAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
