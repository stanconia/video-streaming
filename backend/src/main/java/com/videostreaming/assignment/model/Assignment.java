package com.videostreaming.assignment.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignments")
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String moduleId;

    @Column(nullable = false)
    private String courseId;

    @Column(nullable = false)
    private String teacherUserId;

    @Column(nullable = false)
    private String title;

    @Column(length = 5000)
    private String description;

    private LocalDateTime dueDate;

    private int maxScore;

    private int orderIndex;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Assignment() {}

    public Assignment(String id, String moduleId, String courseId, String teacherUserId,
                      String title, String description, LocalDateTime dueDate, int maxScore,
                      int orderIndex, LocalDateTime createdAt) {
        this.id = id;
        this.moduleId = moduleId;
        this.courseId = courseId;
        this.teacherUserId = teacherUserId;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.maxScore = maxScore;
        this.orderIndex = orderIndex;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (maxScore == 0) {
            maxScore = 100;
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public int getMaxScore() { return maxScore; }
    public void setMaxScore(int maxScore) { this.maxScore = maxScore; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static AssignmentBuilder builder() {
        return new AssignmentBuilder();
    }

    public static class AssignmentBuilder {
        private String id;
        private String moduleId;
        private String courseId;
        private String teacherUserId;
        private String title;
        private String description;
        private LocalDateTime dueDate;
        private int maxScore;
        private int orderIndex;
        private LocalDateTime createdAt;

        public AssignmentBuilder id(String id) { this.id = id; return this; }
        public AssignmentBuilder moduleId(String moduleId) { this.moduleId = moduleId; return this; }
        public AssignmentBuilder courseId(String courseId) { this.courseId = courseId; return this; }
        public AssignmentBuilder teacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; return this; }
        public AssignmentBuilder title(String title) { this.title = title; return this; }
        public AssignmentBuilder description(String description) { this.description = description; return this; }
        public AssignmentBuilder dueDate(LocalDateTime dueDate) { this.dueDate = dueDate; return this; }
        public AssignmentBuilder maxScore(int maxScore) { this.maxScore = maxScore; return this; }
        public AssignmentBuilder orderIndex(int orderIndex) { this.orderIndex = orderIndex; return this; }
        public AssignmentBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Assignment build() {
            return new Assignment(id, moduleId, courseId, teacherUserId, title, description,
                    dueDate, maxScore, orderIndex, createdAt);
        }
    }
}
