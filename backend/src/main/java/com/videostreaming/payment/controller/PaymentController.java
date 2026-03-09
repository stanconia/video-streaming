package com.videostreaming.payment.controller;

import com.videostreaming.config.StripeConfig;
import com.videostreaming.payment.service.EscrowPaymentService;
import com.videostreaming.payment.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final StripeConfig stripeConfig;
    private final EscrowPaymentService escrowPaymentService;

    public PaymentController(PaymentService paymentService, StripeConfig stripeConfig,
                              EscrowPaymentService escrowPaymentService) {
        this.paymentService = paymentService;
        this.stripeConfig = stripeConfig;
        this.escrowPaymentService = escrowPaymentService;
    }

    @PostMapping("/create-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody Map<String, Object> request,
                                                   Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            String classId = (String) request.get("classId");
            Number amountNumber = (Number) request.get("amount");
            String currency = (String) request.getOrDefault("currency", "USD");

            if (classId == null || amountNumber == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "classId and amount are required"));
            }

            long amountCents = amountNumber.longValue();
            Map<String, String> result = paymentService.createPaymentIntent(amountCents, currency, classId, userId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getConfig() {
        return ResponseEntity.ok(Map.of("publishableKey", stripeConfig.getPublishableKey()));
    }

    @PostMapping("/refund")
    public ResponseEntity<?> requestRefund(@RequestBody Map<String, String> body,
                                             Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            String bookingId = body.get("bookingId");
            if (bookingId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "bookingId is required"));
            }
            return ResponseEntity.ok(escrowPaymentService.processRefund(bookingId, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody String payload,
                                                  @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            paymentService.handleWebhookEvent(payload, sigHeader);
            return ResponseEntity.ok("OK");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
