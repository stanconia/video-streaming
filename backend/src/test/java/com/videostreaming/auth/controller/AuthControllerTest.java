package com.videostreaming.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.videostreaming.auth.dto.AuthResponse;
import com.videostreaming.auth.dto.GoogleLoginRequest;
import com.videostreaming.auth.dto.LoginRequest;
import com.videostreaming.auth.dto.RegisterRequest;
import com.videostreaming.auth.service.AuthService;
import com.videostreaming.course.repository.CourseEnrollmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private CourseEnrollmentRepository courseEnrollmentRepository;

    @InjectMocks
    private AuthController controller;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void register_validRequest_returns201() throws Exception {
        // given
        RegisterRequest request = new RegisterRequest("test@example.com", "password123", "Test User", "STUDENT");
        request.setDateOfBirth("1990-01-15");
        AuthResponse response = new AuthResponse("jwt-token-123", "user-1", "test@example.com", "Test User", "STUDENT");

        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        // when/then
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("jwt-token-123"))
                .andExpect(jsonPath("$.userId").value("user-1"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.displayName").value("Test User"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    void register_duplicateEmail_returns400() throws Exception {
        // given
        RegisterRequest request = new RegisterRequest("existing@example.com", "password123", "Test User", "STUDENT");
        request.setDateOfBirth("1990-01-15");

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new RuntimeException("Email already registered"));

        // when/then
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already registered"));
    }

    @Test
    void login_validCredentials_returns200() throws Exception {
        // given
        LoginRequest request = new LoginRequest("test@example.com", "password123");
        AuthResponse response = new AuthResponse("jwt-token-456", "user-1", "test@example.com", "Test User", "STUDENT");

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        // when/then
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-456"))
                .andExpect(jsonPath("$.userId").value("user-1"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.displayName").value("Test User"));
    }

    @Test
    void login_invalidCredentials_returns401() throws Exception {
        // given
        LoginRequest request = new LoginRequest("test@example.com", "wrongpassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new RuntimeException("Invalid credentials"));

        // when/then
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid credentials"));
    }

    @Test
    void googleLogin_validToken_returns200() throws Exception {
        // given
        GoogleLoginRequest request = new GoogleLoginRequest("google-id-token-abc");
        AuthResponse response = new AuthResponse("jwt-token-789", "user-2", "google@example.com", "Google User", "STUDENT");

        when(authService.loginWithGoogle(eq("google-id-token-abc"))).thenReturn(response);

        // when/then
        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-789"))
                .andExpect(jsonPath("$.userId").value("user-2"))
                .andExpect(jsonPath("$.email").value("google@example.com"))
                .andExpect(jsonPath("$.displayName").value("Google User"));
    }
}
