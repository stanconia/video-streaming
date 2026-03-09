package com.videostreaming.auth.service;

import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private User testUser;

    // A secret that is at least 256 bits (32 bytes) for HMAC-SHA
    private static final String TEST_SECRET = "ThisIsAVeryLongSecretKeyForTestingJwtServiceAtLeast32Bytes!";
    private static final long TEST_EXPIRATION_MS = 3600000L; // 1 hour

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(TEST_SECRET, TEST_EXPIRATION_MS);

        testUser = User.builder()
                .id("user-jwt-123")
                .email("jwt@example.com")
                .displayName("JWT User")
                .role(UserRole.STUDENT)
                .build();
    }

    @Test
    void generateToken_returnsNonNullJwt() {
        String token = jwtService.generateToken(testUser);

        assertNotNull(token);
        assertFalse(token.isEmpty());
        // JWT tokens have 3 parts separated by dots
        assertEquals(3, token.split("\\.").length);
    }

    @Test
    void parseToken_returnsCorrectUserId() {
        String token = jwtService.generateToken(testUser);

        Claims claims = jwtService.parseToken(token);

        assertEquals("user-jwt-123", claims.getSubject());
    }

    @Test
    void parseToken_returnsCorrectEmail() {
        String token = jwtService.generateToken(testUser);

        Claims claims = jwtService.parseToken(token);

        assertEquals("jwt@example.com", claims.get("email", String.class));
    }

    @Test
    void parseToken_returnsCorrectDisplayName() {
        String token = jwtService.generateToken(testUser);

        Claims claims = jwtService.parseToken(token);

        assertEquals("JWT User", claims.get("displayName", String.class));
    }

    @Test
    void parseToken_returnsCorrectRole() {
        String token = jwtService.generateToken(testUser);

        Claims claims = jwtService.parseToken(token);

        assertEquals("STUDENT", claims.get("role", String.class));
    }

    @Test
    void validateToken_validToken_returnsTrue() {
        String token = jwtService.generateToken(testUser);

        assertTrue(jwtService.validateToken(token));
    }

    @Test
    void validateToken_expiredToken_returnsFalse() {
        // Create a service with 0ms expiration so the token expires immediately
        JwtService shortLivedService = new JwtService(TEST_SECRET, 0L);

        String token = shortLivedService.generateToken(testUser);

        // The token should already be expired (or just at the edge)
        // A tiny sleep to ensure expiration has passed
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        assertFalse(shortLivedService.validateToken(token));
    }

    @Test
    void validateToken_tamperedToken_returnsFalse() {
        String token = jwtService.generateToken(testUser);
        // Tamper with the token by modifying the last character
        String tamperedToken = token.substring(0, token.length() - 1) + (token.endsWith("A") ? "B" : "A");

        assertFalse(jwtService.validateToken(tamperedToken));
    }

    @Test
    void validateToken_garbageString_returnsFalse() {
        assertFalse(jwtService.validateToken("not.a.valid.jwt"));
    }

    @Test
    void generateToken_differentUsers_produceDifferentTokens() {
        User anotherUser = User.builder()
                .id("user-jwt-456")
                .email("another@example.com")
                .displayName("Another User")
                .role(UserRole.TEACHER)
                .build();

        String token1 = jwtService.generateToken(testUser);
        String token2 = jwtService.generateToken(anotherUser);

        assertNotEquals(token1, token2);
    }
}
