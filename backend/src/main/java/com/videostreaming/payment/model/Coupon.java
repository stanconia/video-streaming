package com.videostreaming.payment.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private String teacherUserId;

    @Column
    private Integer discountPercent;

    @Column
    private BigDecimal discountAmount;

    @Column(nullable = false)
    private int maxUses;

    @Column(nullable = false)
    private int usedCount;

    @Column
    private LocalDateTime validFrom;

    @Column
    private LocalDateTime validUntil;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Coupon() {}

    public Coupon(String id, String code, String teacherUserId, Integer discountPercent,
                  BigDecimal discountAmount, int maxUses, int usedCount, LocalDateTime validFrom,
                  LocalDateTime validUntil, boolean active, LocalDateTime createdAt) {
        this.id = id;
        this.code = code;
        this.teacherUserId = teacherUserId;
        this.discountPercent = discountPercent;
        this.discountAmount = discountAmount;
        this.maxUses = maxUses;
        this.usedCount = usedCount;
        this.validFrom = validFrom;
        this.validUntil = validUntil;
        this.active = active;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        active = true;
        usedCount = 0;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; }

    public Integer getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Integer discountPercent) { this.discountPercent = discountPercent; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public int getMaxUses() { return maxUses; }
    public void setMaxUses(int maxUses) { this.maxUses = maxUses; }

    public int getUsedCount() { return usedCount; }
    public void setUsedCount(int usedCount) { this.usedCount = usedCount; }

    public LocalDateTime getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDateTime validFrom) { this.validFrom = validFrom; }

    public LocalDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDateTime validUntil) { this.validUntil = validUntil; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static CouponBuilder builder() {
        return new CouponBuilder();
    }

    public static class CouponBuilder {
        private String id;
        private String code;
        private String teacherUserId;
        private Integer discountPercent;
        private BigDecimal discountAmount;
        private int maxUses;
        private int usedCount;
        private LocalDateTime validFrom;
        private LocalDateTime validUntil;
        private boolean active;
        private LocalDateTime createdAt;

        public CouponBuilder id(String id) { this.id = id; return this; }
        public CouponBuilder code(String code) { this.code = code; return this; }
        public CouponBuilder teacherUserId(String teacherUserId) { this.teacherUserId = teacherUserId; return this; }
        public CouponBuilder discountPercent(Integer discountPercent) { this.discountPercent = discountPercent; return this; }
        public CouponBuilder discountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; return this; }
        public CouponBuilder maxUses(int maxUses) { this.maxUses = maxUses; return this; }
        public CouponBuilder usedCount(int usedCount) { this.usedCount = usedCount; return this; }
        public CouponBuilder validFrom(LocalDateTime validFrom) { this.validFrom = validFrom; return this; }
        public CouponBuilder validUntil(LocalDateTime validUntil) { this.validUntil = validUntil; return this; }
        public CouponBuilder active(boolean active) { this.active = active; return this; }
        public CouponBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Coupon build() {
            return new Coupon(id, code, teacherUserId, discountPercent, discountAmount,
                    maxUses, usedCount, validFrom, validUntil, active, createdAt);
        }
    }
}
