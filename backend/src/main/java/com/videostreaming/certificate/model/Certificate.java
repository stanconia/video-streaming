package com.videostreaming.certificate.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"classId", "studentUserId"})
})
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String classId;

    @Column(nullable = false)
    private String studentUserId;

    @Column(nullable = false)
    private String classTitle;

    @Column(nullable = false)
    private String teacherDisplayName;

    @Column(nullable = false)
    private LocalDateTime completedAt;

    @Column
    private String certificateUrl;

    @Column(nullable = false)
    private LocalDateTime issuedAt;

    public Certificate() {}

    public Certificate(String id, String classId, String studentUserId, String classTitle,
                       String teacherDisplayName, LocalDateTime completedAt, String certificateUrl,
                       LocalDateTime issuedAt) {
        this.id = id;
        this.classId = classId;
        this.studentUserId = studentUserId;
        this.classTitle = classTitle;
        this.teacherDisplayName = teacherDisplayName;
        this.completedAt = completedAt;
        this.certificateUrl = certificateUrl;
        this.issuedAt = issuedAt;
    }

    @PrePersist
    protected void onCreate() {
        issuedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }

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

    public static CertificateBuilder builder() {
        return new CertificateBuilder();
    }

    public static class CertificateBuilder {
        private String id;
        private String classId;
        private String studentUserId;
        private String classTitle;
        private String teacherDisplayName;
        private LocalDateTime completedAt;
        private String certificateUrl;
        private LocalDateTime issuedAt;

        public CertificateBuilder id(String id) { this.id = id; return this; }
        public CertificateBuilder classId(String classId) { this.classId = classId; return this; }
        public CertificateBuilder studentUserId(String studentUserId) { this.studentUserId = studentUserId; return this; }
        public CertificateBuilder classTitle(String classTitle) { this.classTitle = classTitle; return this; }
        public CertificateBuilder teacherDisplayName(String teacherDisplayName) { this.teacherDisplayName = teacherDisplayName; return this; }
        public CertificateBuilder completedAt(LocalDateTime completedAt) { this.completedAt = completedAt; return this; }
        public CertificateBuilder certificateUrl(String certificateUrl) { this.certificateUrl = certificateUrl; return this; }
        public CertificateBuilder issuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; return this; }

        public Certificate build() {
            return new Certificate(id, classId, studentUserId, classTitle, teacherDisplayName,
                    completedAt, certificateUrl, issuedAt);
        }
    }
}
