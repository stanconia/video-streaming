package com.videostreaming.payment.service;

import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import com.stripe.param.AccountCreateParams;
import com.stripe.param.AccountLinkCreateParams;
import com.videostreaming.teacher.model.TeacherProfile;
import com.videostreaming.payment.dto.StripeConnectResponse;
import com.videostreaming.teacher.repository.TeacherProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class StripeConnectService {

    private static final Logger logger = LoggerFactory.getLogger(StripeConnectService.class);
    private final TeacherProfileRepository teacherProfileRepository;

    public StripeConnectService(TeacherProfileRepository teacherProfileRepository) {
        this.teacherProfileRepository = teacherProfileRepository;
    }

    public StripeConnectResponse createConnectAccount(String teacherUserId) {
        TeacherProfile profile = teacherProfileRepository.findByUserId(teacherUserId)
                .orElseThrow(() -> new RuntimeException("Teacher profile not found"));
        if (profile.getStripeAccountId() != null) {
            return new StripeConnectResponse(profile.getStripeAccountId(), null, profile.isStripeOnboarded());
        }
        try {
            AccountCreateParams params = AccountCreateParams.builder()
                    .setType(AccountCreateParams.Type.EXPRESS)
                    .putMetadata("teacherUserId", teacherUserId)
                    .build();
            Account account = Account.create(params);
            profile.setStripeAccountId(account.getId());
            teacherProfileRepository.save(profile);
            logger.info("Created Stripe Connect account {} for teacher {}", account.getId(), teacherUserId);
            return new StripeConnectResponse(account.getId(), null, false);
        } catch (StripeException e) {
            logger.error("Stripe Connect account creation failed: {}", e.getMessage());
            throw new RuntimeException("Failed to create Stripe account: " + e.getMessage());
        }
    }

    public StripeConnectResponse createOnboardingLink(String teacherUserId, String returnUrl, String refreshUrl) {
        TeacherProfile profile = teacherProfileRepository.findByUserId(teacherUserId)
                .orElseThrow(() -> new RuntimeException("Teacher profile not found"));
        if (profile.getStripeAccountId() == null) {
            throw new RuntimeException("No Stripe account found. Create one first.");
        }
        try {
            AccountLinkCreateParams params = AccountLinkCreateParams.builder()
                    .setAccount(profile.getStripeAccountId())
                    .setRefreshUrl(refreshUrl)
                    .setReturnUrl(returnUrl)
                    .setType(AccountLinkCreateParams.Type.ACCOUNT_ONBOARDING)
                    .build();
            AccountLink link = AccountLink.create(params);
            return new StripeConnectResponse(profile.getStripeAccountId(), link.getUrl(), profile.isStripeOnboarded());
        } catch (StripeException e) {
            logger.error("Stripe onboarding link creation failed: {}", e.getMessage());
            throw new RuntimeException("Failed to create onboarding link: " + e.getMessage());
        }
    }

    public StripeConnectResponse getAccountStatus(String teacherUserId) {
        TeacherProfile profile = teacherProfileRepository.findByUserId(teacherUserId)
                .orElse(null);
        if (profile == null || profile.getStripeAccountId() == null) {
            return new StripeConnectResponse(null, null, false);
        }
        try {
            Account account = Account.retrieve(profile.getStripeAccountId());
            boolean onboarded = account.getChargesEnabled() != null && account.getChargesEnabled();
            if (onboarded && !profile.isStripeOnboarded()) {
                profile.setStripeOnboarded(true);
                teacherProfileRepository.save(profile);
            }
            return new StripeConnectResponse(profile.getStripeAccountId(), null, onboarded);
        } catch (StripeException e) {
            logger.error("Failed to retrieve Stripe account status: {}", e.getMessage());
            return new StripeConnectResponse(profile.getStripeAccountId(), null, profile.isStripeOnboarded());
        }
    }

    public void handleAccountUpdate(String accountId) {
        teacherProfileRepository.findAll().stream()
                .filter(p -> accountId.equals(p.getStripeAccountId()))
                .findFirst()
                .ifPresent(profile -> {
                    try {
                        Account account = Account.retrieve(accountId);
                        if (account.getChargesEnabled() != null && account.getChargesEnabled()) {
                            profile.setStripeOnboarded(true);
                            teacherProfileRepository.save(profile);
                            logger.info("Teacher {} Stripe account onboarding completed", profile.getUserId());
                        }
                    } catch (StripeException e) {
                        logger.error("Error handling account update: {}", e.getMessage());
                    }
                });
    }
}
