package com.videostreaming.assignment.dto;

import java.time.LocalDateTime;

public class AssignmentSubmissionResponse {

    private String id;
    private String assignmentId;
    private String studentUserId;
    private String studentDisplayName;
    private String content;
    private String fileUrl;
    private String fileName;
    private Integer score;
    private String feedback;
    private LocalDateTime gradedAt;
    private LocalDateTime submittedAt;

    public AssignmentSubmissionResponse() {}

    public AssignmentSubmissionResponse(String id, String assignmentId, String studentUserId,
                                        String studentDisplayName, String content, String fileUrl,
                                        String fileName, Integer score, String feedback,
                                        LocalDateTime gradedAt, LocalDateTime submittedAt) {
        this.id = id;
        this.assignmentId = assignmentId;
        this.studentUserId = studentUserId;
        this.studentDisplayName = studentDisplayName;
        this.content = content;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
        this.score = score;
        this.feedback = feedback;
        this.gradedAt = gradedAt;
        this.submittedAt = submittedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }

    public String getStudentDisplayName() { return studentDisplayName; }
    public void setStudentDisplayName(String studentDisplayName) { this.studentDisplayName = studentDisplayName; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

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
}
