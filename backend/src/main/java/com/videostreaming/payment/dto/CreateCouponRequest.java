package com.videostreaming.payment.dto;

import java.math.BigDecimal;

public class CreateCouponRequest {
    private String code;
    private Integer discountPercent;
    private BigDecimal discountAmount;
    private int maxUses;
    private String validFrom;
    private String validUntil;

    public CreateCouponRequest() {}

    public CreateCouponRequest(String code, Integer discountPercent, BigDecimal discountAmount,
                               int maxUses, String validFrom, String validUntil) {
        this.code = code;
        this.discountPercent = discountPercent;
        this.discountAmount = discountAmount;
        this.maxUses = maxUses;
        this.validFrom = validFrom;
        this.validUntil = validUntil;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Integer getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Integer discountPercent) { this.discountPercent = discountPercent; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public int getMaxUses() { return maxUses; }
    public void setMaxUses(int maxUses) { this.maxUses = maxUses; }

    public String getValidFrom() { return validFrom; }
    public void setValidFrom(String validFrom) { this.validFrom = validFrom; }

    public String getValidUntil() { return validUntil; }
    public void setValidUntil(String validUntil) { this.validUntil = validUntil; }
}
