package com.videostreaming.payment.controller;

import com.videostreaming.payment.dto.SetupBankAccountRequest;
import com.videostreaming.teacher.service.BackgroundCheckService;
import com.videostreaming.payment.service.StripeConnectService;
import jakarta.servlet.http.HttpServletRequest;
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

    @PostMapping("/setup-bank-account")
    public ResponseEntity<?> setupBankAccount(Authentication authentication,
                                                @RequestBody SetupBankAccountRequest request,
                                                HttpServletRequest httpRequest) {
        try {
            String userId = (String) authentication.getPrincipal();
            String ipAddress = httpRequest.getHeader("X-Forwarded-For") != null
                    ? httpRequest.getHeader("X-Forwarded-For").split(",")[0].trim()
                    : httpRequest.getRemoteAddr();
            return ResponseEntity.ok(
                stripeConnectService.setupBankAccount(userId, request, ipAddress));
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
