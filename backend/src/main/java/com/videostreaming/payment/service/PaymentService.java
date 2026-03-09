package com.videostreaming.payment.service;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.videostreaming.config.StripeConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private final StripeConfig stripeConfig;
    private final EscrowPaymentService escrowPaymentService;
    private final StripeConnectService stripeConnectService;

    public PaymentService(StripeConfig stripeConfig,
                          EscrowPaymentService escrowPaymentService,
                          StripeConnectService stripeConnectService) {
        this.stripeConfig = stripeConfig;
        this.escrowPaymentService = escrowPaymentService;
        this.stripeConnectService = stripeConnectService;
    }

    public Map<String, String> createPaymentIntent(long amountCents, String currency,
                                                     String classId, String studentUserId) {
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountCents)
                    .setCurrency(currency.toLowerCase())
                    .putMetadata("classId", classId)
                    .putMetadata("studentUserId", studentUserId)
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);

            logger.info("Created PaymentIntent {} for class {} by student {}",
                    paymentIntent.getId(), classId, studentUserId);

            return Map.of(
                    "clientSecret", paymentIntent.getClientSecret(),
                    "paymentIntentId", paymentIntent.getId()
            );
        } catch (StripeException e) {
            logger.error("Stripe error creating PaymentIntent: {}", e.getMessage());
            throw new RuntimeException("Payment processing error: " + e.getMessage());
        }
    }

    public void handleWebhookEvent(String payload, String sigHeader) {
        try {
            Event event = Webhook.constructEvent(payload, sigHeader, stripeConfig.getWebhookSecret());

            switch (event.getType()) {
                case "payment_intent.succeeded":
                    handlePaymentSucceeded(event);
                    break;
                case "payment_intent.payment_failed":
                    logger.warn("Payment failed: {}", event.getId());
                    break;
                case "account.updated":
                    handleAccountUpdated(event);
                    break;
                case "transfer.created":
                    logger.info("Transfer created: {}", event.getId());
                    break;
                default:
                    logger.debug("Unhandled Stripe event type: {}", event.getType());
            }
        } catch (SignatureVerificationException e) {
            logger.error("Stripe webhook signature verification failed: {}", e.getMessage());
            throw new RuntimeException("Invalid webhook signature");
        }
    }

    private void handlePaymentSucceeded(Event event) {
        logger.info("Payment succeeded: {}", event.getId());
        // Extract payment intent ID and capture in escrow
        event.getDataObjectDeserializer().getObject().ifPresent(obj -> {
            if (obj instanceof PaymentIntent pi) {
                escrowPaymentService.capturePaymentWithEscrow(pi.getId());
            }
        });
    }

    private void handleAccountUpdated(Event event) {
        logger.info("Account updated: {}", event.getId());
        event.getDataObjectDeserializer().getObject().ifPresent(obj -> {
            if (obj instanceof com.stripe.model.Account account) {
                stripeConnectService.handleAccountUpdate(account.getId());
            }
        });
    }
}
