package com.videostreaming.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.videostreaming.auth.model.ParentalConsent;
import com.videostreaming.auth.model.PasswordResetToken;
import com.videostreaming.auth.repository.ParentalConsentRepository;
import com.videostreaming.auth.repository.PasswordResetTokenRepository;
import com.videostreaming.notification.service.EmailService;
import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.teacher.model.TeacherProfile;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import com.videostreaming.auth.dto.AuthResponse;
import com.videostreaming.auth.dto.LoginRequest;
import com.videostreaming.auth.dto.RegisterRequest;
import com.videostreaming.teacher.repository.TeacherProfileRepository;
import com.videostreaming.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final TeacherProfileRepository teacherProfileRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final ParentalConsentRepository parentalConsentRepository;

    @Value("${google.client-id:}")
    private String googleClientId;

    @Value("${google.client-secret:}")
    private String googleClientSecret;

    @Value("${app.frontend-url:http://localhost:3001}")
    private String frontendUrl;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, NotificationService notificationService,
                       EmailService emailService,
                       TeacherProfileRepository teacherProfileRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       ParentalConsentRepository parentalConsentRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.teacherProfileRepository = teacherProfileRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.parentalConsentRepository = parentalConsentRepository;
    }

    public AuthResponse register(RegisterRequest request) {
        var existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            User existing = existingUser.get();
            if (existing.getDateOfBirth() != null && Period.between(existing.getDateOfBirth(), LocalDate.now()).getYears() < 13 && !existing.getParentalConsentGranted()) {
                userRepository.delete(existing);
                logger.info("Deleted unapproved COPPA account {} for re-registration", existing.getEmail());
            } else {
            throw new RuntimeException("Email already registered");
            }
        }

        // Parse and validate date of birth
        LocalDate dob = null;
        boolean isMinor = false;
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isBlank()) {
            try {
                dob = LocalDate.parse(request.getDateOfBirth());
            } catch (Exception e) {
                throw new RuntimeException("Invalid date of birth format. Use YYYY-MM-DD.");
            }
            int age = Period.between(dob, LocalDate.now()).getYears();
            isMinor = age < 13;

            // COPPA: require parent email for under-13
            if (isMinor && (request.getParentEmail() == null || request.getParentEmail().isBlank())) {
                throw new RuntimeException("Parent/guardian email is required for users under 13");
            }
            if (isMinor && request.getParentEmail() != null
                    && request.getParentEmail().equalsIgnoreCase(request.getEmail())) {
                throw new RuntimeException("Parent/guardian email must be different from your email");
            }
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .role(UserRole.valueOf(request.getRole()))
                .dateOfBirth(dob)
                .parentEmail(isMinor ? request.getParentEmail() : null)
                .parentalConsentGranted(!isMinor)
                .build();

        user.setPhone(request.getPhone());
        user.setLocation(request.getLocation());
        user.setBio(request.getBio());
        if (request.getSubjectInterests() != null) {
            user.setSubjectInterests(request.getSubjectInterests());
        }

        user = userRepository.save(user);

        if (user.getRole() == UserRole.TEACHER) {
            TeacherProfile profile = TeacherProfile.builder()
                    .userId(user.getId())
                    .displayName(user.getDisplayName())
                    .bio(request.getBio() != null ? request.getBio() : "")
                    .headline(request.getHeadline() != null ? request.getHeadline() : "")
                    .subjects(request.getSubjects() != null ? request.getSubjects() : "")
                    .hourlyRate(0)
                    .experienceYears(request.getExperienceYears())
                    .build();
            teacherProfileRepository.save(profile);
        }

        // COPPA: send parental consent email for under-13
        if (isMinor) {
            sendParentalConsentEmail(user, ParentalConsent.ConsentType.REGISTRATION, null, null);
            logger.info("Parental consent request sent for under-13 user {}", user.getId());

            // Don't return a token — COPPA kids cannot sign in until parent approves
            return new AuthResponse(null, user.getId(), user.getEmail(), user.getDisplayName(),
                    user.getRole().name(), true, false);
        }

        notificationService.sendWelcomeEmail(user.getId());

        String token = jwtService.generateToken(user);

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getDisplayName(),
                user.getRole().name(), false, true);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        boolean requiresConsent = user.getDateOfBirth() != null
                && Period.between(user.getDateOfBirth(), LocalDate.now()).getYears() < 13;

        // Block login for COPPA kids without parental consent
        if (requiresConsent && !user.getParentalConsentGranted()) {
            throw new RuntimeException("Your account is pending parental approval. Please ask your parent/guardian to check their email.");
        }

        String token = jwtService.generateToken(user);

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getDisplayName(),
                user.getRole().name(), requiresConsent, user.getParentalConsentGranted());
    }

    public AuthResponse loginWithGoogle(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new RuntimeException("Invalid Google ID token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");
            String googleId = payload.getSubject();

            // Find existing user by email or create new one
            User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                // Create new user (default role: STUDENT)
                user = User.builder()
                        .email(email)
                        .displayName(name != null ? name : email.split("@")[0])
                        .role(UserRole.STUDENT)
                        .authProvider("GOOGLE")
                        .googleId(googleId)
                        .build();
                if (pictureUrl != null) {
                    user.setProfileImageUrl(pictureUrl);
                }
                user = userRepository.save(user);

                notificationService.sendWelcomeEmail(user.getId());
            } else {
                // Link Google account if not already linked
                if (user.getGoogleId() == null) {
                    user.setGoogleId(googleId);
                    user.setAuthProvider("GOOGLE");
                    if (user.getProfileImageUrl() == null && pictureUrl != null) {
                        user.setProfileImageUrl(pictureUrl);
                    }
                    user = userRepository.save(user);
                }
            }

            String token = jwtService.generateToken(user);
            return new AuthResponse(token, user.getId(), user.getEmail(), user.getDisplayName(), user.getRole().name());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Google authentication failed: " + e.getMessage());
        }
    }

    public AuthResponse loginWithGoogleCode(String authorizationCode) {
        try {
            GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance(),
                    googleClientId, googleClientSecret,
                    authorizationCode, "postmessage")
                    .execute();

            String accessToken = tokenResponse.getAccessToken();
            String refreshToken = tokenResponse.getRefreshToken();

            GoogleIdToken idToken = tokenResponse.parseIdToken();
            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");
            String googleId = payload.getSubject();

            User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                user = User.builder()
                        .email(email)
                        .displayName(name != null ? name : email.split("@")[0])
                        .role(UserRole.STUDENT)
                        .authProvider("GOOGLE")
                        .googleId(googleId)
                        .build();
                if (pictureUrl != null) {
                    user.setProfileImageUrl(pictureUrl);
                }
            }

            user.setGoogleAccessToken(accessToken);
            if (refreshToken != null) {
                user.setGoogleRefreshToken(refreshToken);
            }
            user.setGoogleTokenExpiresAt(LocalDateTime.now().plusSeconds(
                    tokenResponse.getExpiresInSeconds()));
            user = userRepository.save(user);

            if (user.getCreatedAt() == null) {
                notificationService.sendWelcomeEmail(user.getId());
            }

            String token = jwtService.generateToken(user);
            return new AuthResponse(token, user.getId(), user.getEmail(), user.getDisplayName(), user.getRole().name());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Google authentication failed: " + e.getMessage());
        }
    }

    @Transactional
    public void requestPasswordReset(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            // Clean up any existing unused tokens for this user
            passwordResetTokenRepository.deleteByUserIdAndUsedFalse(user.getId());

            // Generate a new token
            String resetToken = UUID.randomUUID().toString();
            LocalDateTime expiresAt = LocalDateTime.now().plusHours(1);

            PasswordResetToken tokenEntity = new PasswordResetToken(user.getId(), resetToken, expiresAt);
            passwordResetTokenRepository.save(tokenEntity);

            // Send password reset email
            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
            notificationService.sendPasswordResetEmail(user.getId(), resetLink);

            logger.info("Password reset token generated for user {}", user.getId());
        });

        // Always return silently - don't reveal whether email exists
    }

    @Transactional
    public void sendParentalConsentEmail(User user, ParentalConsent.ConsentType consentType,
                                          String courseId, String enrollmentId) {
        String consentToken = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);

        ParentalConsent consent = new ParentalConsent(
                user.getId(), user.getParentEmail(), consentToken, consentType, expiresAt);
        if (courseId != null) consent.setCourseId(courseId);
        if (enrollmentId != null) consent.setEnrollmentId(enrollmentId);
        parentalConsentRepository.save(consent);

        String approveLink = frontendUrl + "/parental-consent?token=" + consentToken + "&action=approve";
        String denyLink = frontendUrl + "/parental-consent?token=" + consentToken + "&action=deny";

        String subject = consentType == ParentalConsent.ConsentType.REGISTRATION
                ? "Parental Consent Required - Account Registration"
                : "Parental Consent Required - Course Enrollment";

        String body = "Dear Parent/Guardian,\n\n"
                + user.getDisplayName() + " has "
                + (consentType == ParentalConsent.ConsentType.REGISTRATION
                    ? "registered for an account" : "requested to enroll in a course")
                + " on KyroAcademy.\n\n"
                + "As they are under 13, we require your consent in compliance with COPPA.\n\n"
                + "To APPROVE, click: " + approveLink + "\n\n"
                + "To DENY, click: " + denyLink + "\n\n"
                + "This link expires in 7 days.\n\n"
                + "If you did not expect this email, please ignore it.\n\n"
                + "Best regards,\nKyroAcademy Team";

        emailService.sendEmail(user.getParentEmail(), subject, body);
    }

    @Transactional
    public Map<String, String> handleParentalConsent(String consentToken, String action) {
        ParentalConsent consent = parentalConsentRepository.findByToken(consentToken)
                .orElseThrow(() -> new RuntimeException("Invalid consent token"));

        if (consent.getStatus() != ParentalConsent.ConsentStatus.PENDING) {
            throw new RuntimeException("This consent request has already been processed");
        }

        if (consent.isExpired()) {
            throw new RuntimeException("This consent link has expired");
        }

        boolean approved = "approve".equalsIgnoreCase(action);
        consent.setStatus(approved ? ParentalConsent.ConsentStatus.APPROVED : ParentalConsent.ConsentStatus.DENIED);
        consent.setRespondedAt(LocalDateTime.now());
        parentalConsentRepository.save(consent);

        Map<String, String> result = new HashMap<>();
        result.put("consentType", consent.getConsentType().name());

        if (consent.getConsentType() == ParentalConsent.ConsentType.REGISTRATION) {
            User user = userRepository.findById(consent.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            if (approved) {
                user.setParentalConsentGranted(true);
                userRepository.save(user);
                result.put("message", "Account approved. " + user.getDisplayName() + " can now use the platform.");
            } else {
                result.put("message", "Account access denied. " + user.getDisplayName() + "'s account will remain restricted.");
            }
        } else if (consent.getConsentType() == ParentalConsent.ConsentType.ENROLLMENT) {
            result.put("enrollmentId", consent.getEnrollmentId());
            result.put("courseId", consent.getCourseId());
            if (approved) {
                result.put("message", "Course enrollment approved.");
            } else {
                result.put("message", "Course enrollment denied.");
            }
        }

        result.put("status", approved ? "APPROVED" : "DENIED");
        logger.info("Parental consent {} for user {} (type: {})", action, consent.getUserId(), consent.getConsentType());
        return result;
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        if (resetToken.isUsed()) {
            throw new RuntimeException("This reset token has already been used");
        }

        if (resetToken.isExpired()) {
            throw new RuntimeException("This reset token has expired");
        }

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        logger.info("Password reset completed for user {}", user.getId());
    }
}
