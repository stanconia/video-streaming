package com.videostreaming.payment.dto;

public class StripeConnectResponse {
    private String accountId;
    private String onboardingUrl;
    private boolean onboarded;

    public StripeConnectResponse() {}

    public StripeConnectResponse(String accountId, String onboardingUrl, boolean onboarded) {
        this.accountId = accountId;
        this.onboardingUrl = onboardingUrl;
        this.onboarded = onboarded;
    }

    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public String getOnboardingUrl() { return onboardingUrl; }
    public void setOnboardingUrl(String onboardingUrl) { this.onboardingUrl = onboardingUrl; }
    public boolean isOnboarded() { return onboarded; }
    public void setOnboarded(boolean onboarded) { this.onboarded = onboarded; }
}
