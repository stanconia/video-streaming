package com.videostreaming.certificate.dto;

import java.time.LocalDateTime;

public class CertificateResponse {
    private String id;
    private String classId;
    private String studentUserId;
    private String studentDisplayName;
    private String classTitle;
    private String teacherDisplayName;
    private LocalDateTime completedAt;
    private String certificateUrl;
    private LocalDateTime issuedAt;

    public CertificateResponse() {}

    public CertificateResponse(String id, String classId, String studentUserId,
                                String studentDisplayName, String classTitle,
                                String teacherDisplayName, LocalDateTime completedAt,
                                String certificateUrl, LocalDateTime issuedAt) {
        this.id = id;
        this.classId = classId;
        this.studentUserId = studentUserId;
        this.studentDisplayName = studentDisplayName;
        this.classTitle = classTitle;
        this.teacherDisplayName = teacherDisplayName;
        this.completedAt = completedAt;
        this.certificateUrl = certificateUrl;
        this.issuedAt = issuedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }

    public String getStudentDisplayName() { return studentDisplayName; }
    public void setStudentDisplayName(String studentDisplayName) { this.studentDisplayName = studentDisplayName; }

    public String getClassTitle() { return classTitle; }
    public void setClassTitle(String classTitle) { this.classTitle = classTitle; }

    public String getTeacherDisplayName() { return teacherDisplayName; }
    public void setTeacherDisplayName(String teacherDisplayName) { this.teacherDisplayName = teacherDisplayName; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public String getCertificateUrl() { return certificateUrl; }
    public void setCertificateUrl(String certificateUrl) { this.certificateUrl = certificateUrl; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }
}
