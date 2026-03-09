package com.videostreaming.assignment.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_submissions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"assignmentId", "studentUserId"})
})
public class AssignmentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String assignmentId;

    @Column(nullable = false)
    private String courseId;

    @Column(nullable = false)
    private String studentUserId;

    @Column(length = 5000)
    private String content;

    private String fileKey;

    private String fileName;

    private Integer score;

    @Column(length = 2000)
    private String feedback;

    private LocalDateTime gradedAt;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    public AssignmentSubmission() {}

    public AssignmentSubmission(String id, String assignmentId, String courseId, String studentUserId,
                                String content, String fileKey, String fileName, Integer score,
                                String feedback, LocalDateTime gradedAt, LocalDateTime submittedAt) {
        this.id = id;
        this.assignmentId = assignmentId;
        this.courseId = courseId;
        this.studentUserId = studentUserId;
        this.content = content;
        this.fileKey = fileKey;
        this.fileName = fileName;
        this.score = score;
        this.feedback = feedback;
        this.gradedAt = gradedAt;
        this.submittedAt = submittedAt;
    }

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getFileKey() { return fileKey; }
    public void setFileKey(String fileKey) { this.fileKey = fileKey; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public LocalDateTime getGradedAt() { return gradedAt; }
    public void setGradedAt(LocalDateTime gradedAt) { this.gradedAt = gradedAt; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public static AssignmentSubmissionBuilder builder() {
        return new AssignmentSubmissionBuilder();
    }

    public static class AssignmentSubmissionBuilder {
        private String id;
        private String assignmentId;
        private String courseId;
        private String studentUserId;
        private String content;
        private String fileKey;
        private String fileName;
        private Integer score;
        private String feedback;
        private LocalDateTime gradedAt;
        private LocalDateTime submittedAt;

        public AssignmentSubmissionBuilder id(String id) { this.id = id; return this; }
        public AssignmentSubmissionBuilder assignmentId(String assignmentId) { this.assignmentId = assignmentId; return this; }
        public AssignmentSubmissionBuilder courseId(String courseId) { this.courseId = courseId; return this; }
        public AssignmentSubmissionBuilder studentUserId(String studentUserId) { this.studentUserId = studentUserId; return this; }
        public AssignmentSubmissionBuilder content(String content) { this.content = content; return this; }
        public AssignmentSubmissionBuilder fileKey(String fileKey) { this.fileKey = fileKey; return this; }
        public AssignmentSubmissionBuilder fileName(String fileName) { this.fileName = fileName; return this; }
        public AssignmentSubmissionBuilder score(Integer score) { this.score = score; return this; }
        public AssignmentSubmissionBuilder feedback(String feedback) { this.feedback = feedback; return this; }
        public AssignmentSubmissionBuilder gradedAt(LocalDateTime gradedAt) { this.gradedAt = gradedAt; return this; }
        public AssignmentSubmissionBuilder submittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; return this; }

        public AssignmentSubmission build() {
            return new AssignmentSubmission(id, assignmentId, courseId, studentUserId, content,
                    fileKey, fileName, score, feedback, gradedAt, submittedAt);
        }
    }
}
