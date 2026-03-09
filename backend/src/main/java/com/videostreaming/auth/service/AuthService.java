package com.videostreaming.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.teacher.model.TeacherProfile;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import com.videostreaming.auth.dto.AuthResponse;
import com.videostreaming.auth.dto.LoginRequest;
import com.videostreaming.auth.dto.RegisterRequest;
import com.videostreaming.teacher.repository.TeacherProfileRepository;
import com.videostreaming.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final NotificationService notificationService;
    private final TeacherProfileRepository teacherProfileRepository;

    @Value("${google.client-id:}")
    private String googleClientId;

    @Value("${google.client-secret:}")
    private String googleClientSecret;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, NotificationService notificationService,
                       TeacherProfileRepository teacherProfileRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.notificationService = notificationService;
        this.teacherProfileRepository = teacherProfileRepository;
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
}
