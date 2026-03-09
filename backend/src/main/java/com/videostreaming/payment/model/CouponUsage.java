package com.videostreaming.payment.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupon_usages")
public class CouponUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String couponId;

    @Column(nullable = false)
    private String studentUserId;

    @Column
    private String bookingId;

    @Column(nullable = false)
    private LocalDateTime usedAt;

    public CouponUsage() {}

    public CouponUsage(String id, String couponId, String studentUserId, String bookingId,
                       LocalDateTime usedAt) {
        this.id = id;
        this.couponId = couponId;
        this.studentUserId = studentUserId;
        this.bookingId = bookingId;
        this.usedAt = usedAt;
    }

    @PrePersist
    protected void onCreate() {
        usedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCouponId() { return couponId; }
    public void setCouponId(String couponId) { this.couponId = couponId; }

    public String getStudentUserId() { return studentUserId; }
    public void setStudentUserId(String studentUserId) { this.studentUserId = studentUserId; }

    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }

    public LocalDateTime getUsedAt() { return usedAt; }
    public void setUsedAt(LocalDateTime usedAt) { this.usedAt = usedAt; }

    public static CouponUsageBuilder builder() {
        return new CouponUsageBuilder();
    }

    public static class CouponUsageBuilder {
        private String id;
        private String couponId;
        private String studentUserId;
        private String bookingId;
        private LocalDateTime usedAt;

        public CouponUsageBuilder id(String id) { this.id = id; return this; }
        public CouponUsageBuilder couponId(String couponId) { this.couponId = couponId; return this; }
        public CouponUsageBuilder studentUserId(String studentUserId) { this.studentUserId = studentUserId; return this; }
        public CouponUsageBuilder bookingId(String bookingId) { this.bookingId = bookingId; return this; }
        public CouponUsageBuilder usedAt(LocalDateTime usedAt) { this.usedAt = usedAt; return this; }

        public CouponUsage build() {
            return new CouponUsage(id, couponId, studentUserId, bookingId, usedAt);
        }
    }
}
