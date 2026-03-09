package com.videostreaming.payment.controller;

import com.videostreaming.teacher.service.BackgroundCheckService;
import com.videostreaming.payment.service.StripeConnectService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stripe-connect")
public class StripeConnectController {

    private final StripeConnectService stripeConnectService;
    private final BackgroundCheckService backgroundCheckService;

    public StripeConnectController(StripeConnectService stripeConnectService,
                                    BackgroundCheckService backgroundCheckService) {
        this.stripeConnectService = stripeConnectService;
        this.backgroundCheckService = backgroundCheckService;
    }

    @PostMapping("/create-account")
    public ResponseEntity<?> createAccount(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(stripeConnectService.createConnectAccount(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/onboarding-link")
    public ResponseEntity<?> getOnboardingLink(Authentication authentication,
                                                 @RequestParam(defaultValue = "http://localhost:3000/stripe-connect") String returnUrl,
                                                 @RequestParam(defaultValue = "http://localhost:3000/stripe-connect") String refreshUrl) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(stripeConnectService.createOnboardingLink(userId, returnUrl, refreshUrl));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(stripeConnectService.getAccountStatus(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/background-check")
    public ResponseEntity<?> initiateBackgroundCheck(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(backgroundCheckService.initiateCheck(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/background-check")
    public ResponseEntity<?> getBackgroundCheckStatus(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(backgroundCheckService.getCheckStatus(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
