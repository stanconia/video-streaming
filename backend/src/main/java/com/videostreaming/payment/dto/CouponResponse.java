package com.videostreaming.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CouponResponse {
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

    public CouponResponse() {}

    public CouponResponse(String id, String code, String teacherUserId, Integer discountPercent,
                           BigDecimal discountAmount, int maxUses, int usedCount,
                           LocalDateTime validFrom, LocalDateTime validUntil, boolean active,
                           LocalDateTime createdAt) {
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
}
