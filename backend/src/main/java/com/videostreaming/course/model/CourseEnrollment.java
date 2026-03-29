package com.videostreaming.course.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_enrollments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"courseId", "studentUserId"})
})
public class CourseEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String courseId;

    @Column(nullable = false)
    private String studentUserId;

    @Column
    private String paymentIntentId;

    @Column
    private BigDecimal paidAmount;

    @Column
    private BigDecimal platformFee;

    @Column
    private BigDecimal teacherPayout;

    @Column
    private String payoutStatus;

    @Column
    private String stripeTransferId;

    @Enumerated(EnumType.STRING)
    @Column
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;

    @Column
    private double progressPercentage = 0;

    @Column(nullable = false)
    private LocalDateTime enrolledAt;

    @Column
    private LocalDateTime completedAt;

    public CourseEnrollment() {}

    public CourseEnrollment(String id, String courseId, String studentUserId, String paymentIntentId,
                            BigDecimal paidAmount, EnrollmentStatus status, double progressPercentage,
                            LocalDateTime enrolledAt, LocalDateTime completedAt) {
        this.id = id;
        this.courseId = courseId;
        this.studentUserId = studentUserId;
        this.paymentIntentId = paymentIntentId;
        this.paidAmount = paidAmount;
        this.status = status;
        this.progressPercentage = progressPercentage;
        this.enrolledAt = enrolledAt;
        this.completedAt = completedAt;
    }

    @PrePersist
    protected void onCreate() {
        enrolledAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }

    public String getPaymentIntentId() { return paymentIntentId; }
    public void setPaymentIntentId(String paymentIntentId) { this.paymentIntentId = paymentIntentId; }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

    public EnrollmentStatus getStatus() { return status; }
    public void setStatus(EnrollmentStatus status) { this.status = status; }

    public double getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(double progressPercentage) { this.progressPercentage = progressPercentage; }

    public LocalDateTime getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(LocalDateTime enrolledAt) { this.enrolledAt = enrolledAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public BigDecimal getPlatformFee() { return platformFee; }
    public void setPlatformFee(BigDecimal platformFee) { this.platformFee = platformFee; }

    public BigDecimal getTeacherPayout() { return teacherPayout; }
    public void setTeacherPayout(BigDecimal teacherPayout) { this.teacherPayout = teacherPayout; }

    public String getPayoutStatus() { return payoutStatus; }
    public void setPayoutStatus(String payoutStatus) { this.payoutStatus = payoutStatus; }

    public String getStripeTransferId() { return stripeTransferId; }
    public void setStripeTransferId(String stripeTransferId) { this.stripeTransferId = stripeTransferId; }

    // Builder pattern
    public static CourseEnrollmentBuilder builder() {
        return new CourseEnrollmentBuilder();
    }

    public static class CourseEnrollmentBuilder {
        private String id;
        private String courseId;
        private String studentUserId;
        private String paymentIntentId;
        private BigDecimal paidAmount;
        private EnrollmentStatus status = EnrollmentStatus.ACTIVE;
        private double progressPercentage = 0;
        private LocalDateTime enrolledAt;
        private LocalDateTime completedAt;

        public CourseEnrollmentBuilder id(String id) { this.id = id; return this; }
        public CourseEnrollmentBuilder courseId(String courseId) { this.courseId = courseId; return this; }
        public CourseEnrollmentBuilder studentUserId(String studentUserId) { this.studentUserId = studentUserId; return this; }
        public CourseEnrollmentBuilder paymentIntentId(String paymentIntentId) { this.paymentIntentId = paymentIntentId; return this; }
        public CourseEnrollmentBuilder paidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; return this; }
        public CourseEnrollmentBuilder status(EnrollmentStatus status) { this.status = status; return this; }
        public CourseEnrollmentBuilder progressPercentage(double progressPercentage) { this.progressPercentage = progressPercentage; return this; }
        public CourseEnrollmentBuilder enrolledAt(LocalDateTime enrolledAt) { this.enrolledAt = enrolledAt; return this; }
        public CourseEnrollmentBuilder completedAt(LocalDateTime completedAt) { this.completedAt = completedAt; return this; }

        public CourseEnrollment build() {
            return new CourseEnrollment(id, courseId, studentUserId, paymentIntentId, paidAmount,
                    status, progressPercentage, enrolledAt, completedAt);
        }
    }
}
