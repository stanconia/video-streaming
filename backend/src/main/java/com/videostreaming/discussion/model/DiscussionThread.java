package com.videostreaming.discussion.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "discussion_threads")
public class DiscussionThread {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String courseId;

    @Column(nullable = false)
    private String authorUserId;

    @Column(nullable = false)
    private String title;

    @Column(length = 5000)
    private String content;

    private int replyCount;

    private LocalDateTime lastActivityAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public DiscussionThread() {}

    public DiscussionThread(String id, String courseId, String authorUserId, String title,
                            String content, int replyCount, LocalDateTime lastActivityAt,
                            LocalDateTime createdAt) {
        this.id = id;
        this.courseId = courseId;
        this.authorUserId = authorUserId;
        this.title = title;
        this.content = content;
        this.replyCount = replyCount;
        this.lastActivityAt = lastActivityAt;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastActivityAt = LocalDateTime.now();
        replyCount = 0;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getAuthorUserId() { return authorUserId; }
    public void setAuthorUserId(String authorUserId) { this.authorUserId = authorUserId; }

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

    public static DiscussionThreadBuilder builder() {
        return new DiscussionThreadBuilder();
    }

    public static class DiscussionThreadBuilder {
        private String id;
        private String courseId;
        private String authorUserId;
        private String title;
        private String content;
        private int replyCount;
        private LocalDateTime lastActivityAt;
        private LocalDateTime createdAt;

        public DiscussionThreadBuilder id(String id) { this.id = id; return this; }
        public DiscussionThreadBuilder courseId(String courseId) { this.courseId = courseId; return this; }
        public DiscussionThreadBuilder authorUserId(String authorUserId) { this.authorUserId = authorUserId; return this; }
        public DiscussionThreadBuilder title(String title) { this.title = title; return this; }
        public DiscussionThreadBuilder content(String content) { this.content = content; return this; }
        public DiscussionThreadBuilder replyCount(int replyCount) { this.replyCount = replyCount; return this; }
        public DiscussionThreadBuilder lastActivityAt(LocalDateTime lastActivityAt) { this.lastActivityAt = lastActivityAt; return this; }
        public DiscussionThreadBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public DiscussionThread build() {
            return new DiscussionThread(id, courseId, authorUserId, title, content,
                    replyCount, lastActivityAt, createdAt);
        }
    }
}
