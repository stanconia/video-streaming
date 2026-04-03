package com.videostreaming.auth.dto;

public class AuthResponse {
    private String token;
    private String userId;
    private String email;
    private String displayName;
    private String role;
    private boolean requiresParentalConsent;
    private boolean parentalConsentGranted;

    public AuthResponse() {}

    public AuthResponse(String token, String userId, String email, String displayName, String role) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.displayName = displayName;
        this.role = role;
    }

    public AuthResponse(String token, String userId, String email, String displayName, String role,
                         boolean requiresParentalConsent, boolean parentalConsentGranted) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.displayName = displayName;
        this.role = role;
        this.requiresParentalConsent = requiresParentalConsent;
        this.parentalConsentGranted = parentalConsentGranted;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isRequiresParentalConsent() { return requiresParentalConsent; }
    public void setRequiresParentalConsent(boolean requiresParentalConsent) { this.requiresParentalConsent = requiresParentalConsent; }

    public boolean isParentalConsentGranted() { return parentalConsentGranted; }
    public void setParentalConsentGranted(boolean parentalConsentGranted) { this.parentalConsentGranted = parentalConsentGranted; }
}
