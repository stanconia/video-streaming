package com.videostreaming.auth.controller;

import com.videostreaming.auth.dto.AuthResponse;
import com.videostreaming.auth.dto.ForgotPasswordRequest;
import com.videostreaming.auth.dto.GoogleLoginRequest;
import com.videostreaming.auth.dto.LoginRequest;
import com.videostreaming.auth.dto.RegisterRequest;
import com.videostreaming.auth.dto.ResetPasswordRequest;
import com.videostreaming.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Authentication failed"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Authentication failed"));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        try {
            AuthResponse response = authService.loginWithGoogle(request.getCredential());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Authentication failed"));
        }
    }

    @PostMapping("/google/code")
    public ResponseEntity<?> googleLoginWithCode(@RequestBody Map<String, String> body) {
        try {
            String code = body.get("code");
            AuthResponse response = authService.loginWithGoogleCode(code);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Authentication failed"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.requestPasswordReset(request.getEmail());
            return ResponseEntity.ok(Map.of("message", "If an account exists with this email, you will receive a password reset link."));
        } catch (RuntimeException e) {
            // Always return success to avoid leaking whether an email exists
            return ResponseEntity.ok(Map.of("message", "If an account exists with this email, you will receive a password reset link."));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Your password has been reset successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Password reset failed"));
        }
    }
}
