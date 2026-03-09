package com.videostreaming.course.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_progress", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"lessonId", "studentUserId"})
})
public class LessonProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String lessonId;

    @Column(nullable = false)
    private String courseId;

    @Column(nullable = false)
    private String studentUserId;

    @Column
    private boolean completed = false;

    @Column
    private LocalDateTime completedAt;

    public LessonProgress() {}

    public LessonProgress(String id, String lessonId, String courseId, String studentUserId,
                          boolean completed, LocalDateTime completedAt) {
        this.id = id;
        this.lessonId = lessonId;
        this.courseId = courseId;
        this.studentUserId = studentUserId;
        this.completed = completed;
        this.completedAt = completedAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLessonId() { return lessonId; }
    public void setLessonId(String lessonId) { this.lessonId = lessonId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    // Builder pattern
    public static LessonProgressBuilder builder() {
        return new LessonProgressBuilder();
    }

    public static class LessonProgressBuilder {
        private String id;
        private String lessonId;
        private String courseId;
        private String studentUserId;
        private boolean completed = false;
        private LocalDateTime completedAt;

        public LessonProgressBuilder id(String id) { this.id = id; return this; }
        public LessonProgressBuilder lessonId(String lessonId) { this.lessonId = lessonId; return this; }
        public LessonProgressBuilder courseId(String courseId) { this.courseId = courseId; return this; }
        public LessonProgressBuilder studentUserId(String studentUserId) { this.studentUserId = studentUserId; return this; }
        public LessonProgressBuilder completed(boolean completed) { this.completed = completed; return this; }
        public LessonProgressBuilder completedAt(LocalDateTime completedAt) { this.completedAt = completedAt; return this; }

        public LessonProgress build() {
            return new LessonProgress(id, lessonId, courseId, studentUserId, completed, completedAt);
        }
    }
}
