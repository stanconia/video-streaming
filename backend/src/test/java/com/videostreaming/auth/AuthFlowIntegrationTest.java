package com.videostreaming.auth;

import com.videostreaming.AbstractIntegrationTest;
import com.videostreaming.auth.dto.LoginRequest;
import com.videostreaming.auth.dto.RegisterRequest;
import com.videostreaming.user.model.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
class AuthFlowIntegrationTest extends AbstractIntegrationTest {

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void register_newStudent_returns201WithToken() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "student@example.com",
                "Password123!",
                "Alice Student",
                "STUDENT"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("student@example.com"))
                .andExpect(jsonPath("$.displayName").value("Alice Student"))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.userId").isNotEmpty());
    }

    @Test
    void register_newTeacher_returns201() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "teacher@example.com",
                "Password123!",
                "Bob Teacher",
                "TEACHER"
        );
        request.setHeadline("Expert Java Instructor");
        request.setSubjects("Java, Spring Boot");
        request.setExperienceYears(8);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("teacher@example.com"))
                .andExpect(jsonPath("$.role").value("TEACHER"));
    }

    @Test
    void register_duplicateEmail_returns400() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "duplicate@example.com",
                "Password123!",
                "Carol Duplicate",
                "STUDENT"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").isNotEmpty());
    }

    @Test
    void login_validCredentials_returns200WithToken() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "login@example.com",
                "Password123!",
                "Dave Login",
                "STUDENT"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = new LoginRequest("login@example.com", "Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("login@example.com"))
                .andExpect(jsonPath("$.displayName").value("Dave Login"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    void login_invalidPassword_returns401() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "badpass@example.com",
                "Password123!",
                "Eve BadPass",
                "STUDENT"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = new LoginRequest("badpass@example.com", "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").isNotEmpty());
    }

    @Test
    void accessProtectedEndpoint_withoutToken_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    void accessProtectedEndpoint_withValidToken_returns200() throws Exception {
        String token = createUserAndGetToken("protected@example.com", "Frank Protected", UserRole.STUDENT);

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", authHeader(token)))
                .andExpect(status().isOk());
    }

    @Test
    void accessAdminEndpoint_asStudent_returns403() throws Exception {
        String token = createUserAndGetToken("student-admin@example.com", "Grace Student", UserRole.STUDENT);

        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", authHeader(token)))
                .andExpect(status().isForbidden());
    }
}
