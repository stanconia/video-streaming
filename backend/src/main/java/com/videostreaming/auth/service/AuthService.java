package com.videostreaming.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.videostreaming.auth.model.PasswordResetToken;
import com.videostreaming.auth.repository.PasswordResetTokenRepository;
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

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final NotificationService notificationService;
    private final TeacherProfileRepository teacherProfileRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Value("${google.client-id:}")
    private String googleClientId;

    @Value("${google.client-secret:}")
    private String googleClientSecret;

    @Value("${app.frontend-url:http://localhost:3001}")
    private String frontendUrl;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, NotificationService notificationService,
                       TeacherProfileRepository teacherProfileRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.notificationService = notificationService;
        this.teacherProfileRepository = teacherProfileRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .role(UserRole.valueOf(request.getRole()))
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

        notificationService.sendWelcomeEmail(user.getId());

        String token = jwtService.generateToken(user);

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getDisplayName(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getDisplayName(), user.getRole().name());
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
