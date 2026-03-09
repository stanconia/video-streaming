package com.videostreaming.scheduling.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"classId", "studentUserId"})
})
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String classId;

    @Column(nullable = false)
    private String studentUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    @Column(nullable = false)
    private double paidAmount;

    private String paymentIntentId;

    private double platformFee;

    private double teacherPayout;

    private String payoutStatus;

    private String stripeTransferId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime cancelledAt;

    private LocalDateTime refundedAt;

    public Booking() {}

    public Booking(String id, String classId, String studentUserId, BookingStatus status, double paidAmount, String paymentIntentId, double platformFee, double teacherPayout, String payoutStatus, String stripeTransferId, LocalDateTime createdAt, LocalDateTime cancelledAt, LocalDateTime refundedAt) {
        this.id = id;
        this.classId = classId;
        this.studentUserId = studentUserId;
        this.status = status;
        this.paidAmount = paidAmount;
        this.paymentIntentId = paymentIntentId;
        this.platformFee = platformFee;
        this.teacherPayout = teacherPayout;
        this.payoutStatus = payoutStatus;
        this.stripeTransferId = stripeTransferId;
        this.createdAt = createdAt;
        this.cancelledAt = cancelledAt;
        this.refundedAt = refundedAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        status = BookingStatus.CONFIRMED;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }

    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }

    public double getPaidAmount() { return paidAmount; }
    public void setPaidAmount(double paidAmount) { this.paidAmount = paidAmount; }

    public String getPaymentIntentId() { return paymentIntentId; }
    public void setPaymentIntentId(String paymentIntentId) { this.paymentIntentId = paymentIntentId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public double getPlatformFee() { return platformFee; }
    public void setPlatformFee(double platformFee) { this.platformFee = platformFee; }

    public double getTeacherPayout() { return teacherPayout; }
    public void setTeacherPayout(double teacherPayout) { this.teacherPayout = teacherPayout; }

    public String getPayoutStatus() { return payoutStatus; }
    public void setPayoutStatus(String payoutStatus) { this.payoutStatus = payoutStatus; }

    public String getStripeTransferId() { return stripeTransferId; }
    public void setStripeTransferId(String stripeTransferId) { this.stripeTransferId = stripeTransferId; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public LocalDateTime getRefundedAt() { return refundedAt; }
    public void setRefundedAt(LocalDateTime refundedAt) { this.refundedAt = refundedAt; }

    // Builder pattern
    public static BookingBuilder builder() {
        return new BookingBuilder();
    }

    public static class BookingBuilder {
        private String id;
        private String classId;
        private String studentUserId;
        private BookingStatus status;
        private double paidAmount;
        private String paymentIntentId;
        private double platformFee;
        private double teacherPayout;
        private String payoutStatus;
        private String stripeTransferId;
        private LocalDateTime createdAt;
        private LocalDateTime cancelledAt;
        private LocalDateTime refundedAt;

        public BookingBuilder id(String id) { this.id = id; return this; }
        public BookingBuilder classId(String classId) { this.classId = classId; return this; }
        public BookingBuilder studentUserId(String studentUserId) { this.studentUserId = studentUserId; return this; }
        public BookingBuilder status(BookingStatus status) { this.status = status; return this; }
        public BookingBuilder paidAmount(double paidAmount) { this.paidAmount = paidAmount; return this; }
        public BookingBuilder paymentIntentId(String paymentIntentId) { this.paymentIntentId = paymentIntentId; return this; }
        public BookingBuilder platformFee(double platformFee) { this.platformFee = platformFee; return this; }
        public BookingBuilder teacherPayout(double teacherPayout) { this.teacherPayout = teacherPayout; return this; }
        public BookingBuilder payoutStatus(String payoutStatus) { this.payoutStatus = payoutStatus; return this; }
        public BookingBuilder stripeTransferId(String stripeTransferId) { this.stripeTransferId = stripeTransferId; return this; }
        public BookingBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public BookingBuilder cancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; return this; }
        public BookingBuilder refundedAt(LocalDateTime refundedAt) { this.refundedAt = refundedAt; return this; }

        public Booking build() {
            return new Booking(id, classId, studentUserId, status, paidAmount, paymentIntentId, platformFee, teacherPayout, payoutStatus, stripeTransferId, createdAt, cancelledAt, refundedAt);
        }
    }
}
