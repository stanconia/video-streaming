package com.videostreaming.payment.dto;

public class PayoutSummaryResponse {
    private double totalEarnings;
    private double pendingPayouts;
    private double completedPayouts;
    private int payoutCount;

    public PayoutSummaryResponse() {}

    public PayoutSummaryResponse(double totalEarnings, double pendingPayouts, double completedPayouts, int payoutCount) {
        this.totalEarnings = totalEarnings;
        this.pendingPayouts = pendingPayouts;
        this.completedPayouts = completedPayouts;
        this.payoutCount = payoutCount;
    }

    public double getTotalEarnings() { return totalEarnings; }
    public void setTotalEarnings(double totalEarnings) { this.totalEarnings = totalEarnings; }
    public double getPendingPayouts() { return pendingPayouts; }
    public void setPendingPayouts(double pendingPayouts) { this.pendingPayouts = pendingPayouts; }
    public double getCompletedPayouts() { return completedPayouts; }
    public void setCompletedPayouts(double completedPayouts) { this.completedPayouts = completedPayouts; }
    public int getPayoutCount() { return payoutCount; }
    public void setPayoutCount(int payoutCount) { this.payoutCount = payoutCount; }
}
