package com.videostreaming.payment.dto;

import java.time.LocalDateTime;

public class RefundResponse {
    private String bookingId;
    private double amount;
    private String status;
    private LocalDateTime refundedAt;

    public RefundResponse() {}

    public RefundResponse(String bookingId, double amount, String status, LocalDateTime refundedAt) {
        this.bookingId = bookingId;
        this.amount = amount;
        this.status = status;
        this.refundedAt = refundedAt;
    }

    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getRefundedAt() { return refundedAt; }
    public void setRefundedAt(LocalDateTime refundedAt) { this.refundedAt = refundedAt; }
}
