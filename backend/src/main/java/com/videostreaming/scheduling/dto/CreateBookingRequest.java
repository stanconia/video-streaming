package com.videostreaming.scheduling.dto;

public class CreateBookingRequest {
    private String classId;
    private String paymentIntentId;

    public CreateBookingRequest() {}

    public CreateBookingRequest(String classId, String paymentIntentId) {
        this.classId = classId;
        this.paymentIntentId = paymentIntentId;
    }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }
    public String getPaymentIntentId() { return paymentIntentId; }
    public void setPaymentIntentId(String paymentIntentId) { this.paymentIntentId = paymentIntentId; }
}
