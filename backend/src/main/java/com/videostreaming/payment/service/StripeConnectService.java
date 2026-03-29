package com.videostreaming.payment.service;

import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.param.AccountCreateParams;
import com.videostreaming.payment.dto.SetupBankAccountRequest;
import com.videostreaming.payment.dto.StripeConnectResponse;
import com.videostreaming.teacher.model.TeacherProfile;
import com.videostreaming.teacher.repository.TeacherProfileRepository;
import com.videostreaming.user.model.User;
import com.videostreaming.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class StripeConnectService {

    private static final Logger logger = LoggerFactory.getLogger(StripeConnectService.class);
    private final TeacherProfileRepository teacherProfileRepository;
    private final UserRepository userRepository;

    public StripeConnectService(TeacherProfileRepository teacherProfileRepository,
                                 UserRepository userRepository) {
        this.teacherProfileRepository = teacherProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public StripeConnectResponse setupBankAccount(String teacherUserId,
                                                    SetupBankAccountRequest request,
                                                    String ipAddress) {
        TeacherProfile profile = teacherProfileRepository.findByUserId(teacherUserId)
                .orElseThrow(() -> new RuntimeException("Teacher profile not found"));

        User user = userRepository.findById(teacherUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        request.validate();

        try {
            String stripeAccountId = profile.getStripeAccountId();

            if (stripeAccountId == null) {
                stripeAccountId = createCustomAccount(user, request, ipAddress);
                profile.setStripeAccountId(stripeAccountId);
            } else {
                updateExternalAccount(stripeAccountId, request);
            }

            String last4 = request.getAccountNumber()
                    .substring(request.getAccountNumber().length() - 4);
            profile.setBankAccountLast4(last4);
            profile.setBankAccountHolderName(request.getAccountHolderName());
            profile.setBankAccountAdded(true);
            profile.setStripeOnboarded(true);
            teacherProfileRepository.save(profile);

            logger.info("Bank account setup completed for teacher {}", teacherUserId);

            return new StripeConnectResponse(true, last4, request.getAccountHolderName(), true);

        } catch (StripeException e) {
            logger.error("Stripe error during bank account setup for teacher {}: {}",
                    teacherUserId, e.getMessage());
            throw new RuntimeException("Failed to setup bank account: " + e.getMessage());
        }
    }

    private String createCustomAccount(User user, SetupBankAccountRequest request,
                                         String ipAddress) throws StripeException {
        String[] nameParts = user.getDisplayName().split("\\s+", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : firstName;

        Map<String, Object> bankAccountParams = new HashMap<>();
        bankAccountParams.put("object", "bank_account");
        bankAccountParams.put("country", "US");
        bankAccountParams.put("currency", "usd");
        bankAccountParams.put("routing_number", request.getRoutingNumber());
        bankAccountParams.put("account_number", request.getAccountNumber());
        bankAccountParams.put("account_holder_name", request.getAccountHolderName());
        bankAccountParams.put("account_holder_type", "individual");

        Map<String, Object> params = new HashMap<>();
        params.put("type", "custom");
        params.put("country", "US");
        params.put("email", user.getEmail());
        params.put("business_type", "individual");

        Map<String, Object> capabilities = new HashMap<>();
        Map<String, Object> transfers = new HashMap<>();
        transfers.put("requested", true);
        capabilities.put("transfers", transfers);
        params.put("capabilities", capabilities);

        Map<String, Object> individual = new HashMap<>();
        individual.put("first_name", firstName);
        individual.put("last_name", lastName);
        individual.put("email", user.getEmail());
        params.put("individual", individual);

        Map<String, Object> tosAcceptance = new HashMap<>();
        tosAcceptance.put("date", Instant.now().getEpochSecond());
        tosAcceptance.put("ip", ipAddress);
        params.put("tos_acceptance", tosAcceptance);

        params.put("external_account", bankAccountParams);

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("teacherUserId", user.getId());
        params.put("metadata", metadata);

        Account account = Account.create(params);
        logger.info("Created Stripe Custom Connect account {} for teacher {}",
                account.getId(), user.getId());
        return account.getId();
    }

    private void updateExternalAccount(String stripeAccountId,
                                         SetupBankAccountRequest request) throws StripeException {
        Account account = Account.retrieve(stripeAccountId);

        Map<String, Object> bankAccountParams = new HashMap<>();
        bankAccountParams.put("object", "bank_account");
        bankAccountParams.put("country", "US");
        bankAccountParams.put("currency", "usd");
        bankAccountParams.put("routing_number", request.getRoutingNumber());
        bankAccountParams.put("account_number", request.getAccountNumber());
        bankAccountParams.put("account_holder_name", request.getAccountHolderName());
        bankAccountParams.put("account_holder_type", "individual");

        Map<String, Object> params = new HashMap<>();
        params.put("external_account", bankAccountParams);
        account.getExternalAccounts().create(params);
        logger.info("Updated external account for Stripe account {}", stripeAccountId);
    }

    public StripeConnectResponse getAccountStatus(String teacherUserId) {
        TeacherProfile profile = teacherProfileRepository.findByUserId(teacherUserId)
                .orElse(null);
        if (profile == null || !profile.isBankAccountAdded()) {
            return new StripeConnectResponse(false, null, null, false);
        }

        boolean transfersEnabled = profile.isStripeOnboarded();
        if (profile.getStripeAccountId() != null) {
            try {
                Account account = Account.retrieve(profile.getStripeAccountId());
                transfersEnabled = account.getCapabilities() != null
                        && "active".equals(account.getCapabilities().getTransfers());
                if (transfersEnabled && !profile.isStripeOnboarded()) {
                    profile.setStripeOnboarded(true);
                    teacherProfileRepository.save(profile);
                }
            } catch (StripeException e) {
                logger.error("Failed to check Stripe account status: {}", e.getMessage());
            }
        }

        return new StripeConnectResponse(
                profile.isBankAccountAdded(),
                profile.getBankAccountLast4(),
                profile.getBankAccountHolderName(),
                transfersEnabled);
    }

    public void handleAccountUpdate(String accountId) {
        teacherProfileRepository.findAll().stream()
                .filter(p -> accountId.equals(p.getStripeAccountId()))
                .findFirst()
                .ifPresent(profile -> {
                    try {
                        Account account = Account.retrieve(accountId);
                        boolean transfersActive = account.getCapabilities() != null
                                && "active".equals(account.getCapabilities().getTransfers());
                        if (transfersActive) {
                            profile.setStripeOnboarded(true);
                            teacherProfileRepository.save(profile);
                            logger.info("Teacher {} Custom Connect account transfers now active",
                                    profile.getUserId());
                        }
                    } catch (StripeException e) {
                        logger.error("Error handling account update: {}", e.getMessage());
                    }
                });
    }
}
