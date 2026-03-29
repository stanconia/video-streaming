package com.videostreaming.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.videostreaming.AbstractIntegrationTest;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
class UserProfileFlowIntegrationTest extends AbstractIntegrationTest {

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    // -------------------------------------------------------------------------
    // 1. Authenticated user retrieves their own profile (includes email)
    // -------------------------------------------------------------------------

    @Test
    void getMyProfile_returnsProfileWithEmail() throws Exception {
        String token = createUserAndGetToken(
                "alice@example.com", "Alice Student", UserRole.STUDENT);

        MvcResult result = mockMvc.perform(get("/api/users/me")
                        .header("Authorization", authHeader(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.displayName").value("Alice Student"))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.get("email").asText()).isEqualTo("alice@example.com");
        assertThat(json.get("displayName").asText()).isEqualTo("Alice Student");
        assertThat(json.get("role").asText()).isEqualTo("STUDENT");
    }

    // -------------------------------------------------------------------------
    // 2. Authenticated user updates their display name and bio
    // -------------------------------------------------------------------------

    @Test
    void updateProfile_changesDisplayName() throws Exception {
        String token = createUserAndGetToken(
                "bob@example.com", "Bob Old Name", UserRole.STUDENT);

        String body = objectMapper.writeValueAsString(Map.of(
                "displayName", "Bob New Name",
                "bio", "Passionate about learning"
        ));

        MvcResult result = mockMvc.perform(put("/api/users/me")
                        .header("Authorization", authHeader(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Bob New Name"))
                .andExpect(jsonPath("$.bio").value("Passionate about learning"))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.get("displayName").asText()).isEqualTo("Bob New Name");
        assertThat(json.get("bio").asText()).isEqualTo("Passionate about learning");
    }

    // -------------------------------------------------------------------------
    // 3. Anyone can view a public profile by userId (no auth required)
    // -------------------------------------------------------------------------

    @Test
    void getPublicProfile_returns200() throws Exception {
        User user = createUser("carol@example.com", "Carol Teacher", UserRole.TEACHER);
        String userId = user.getId();

        mockMvc.perform(get("/api/users/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId))
                .andExpect(jsonPath("$.displayName").value("Carol Teacher"))
                .andExpect(jsonPath("$.role").value("TEACHER"))
                // email must NOT be exposed on the public profile
                .andExpect(jsonPath("$.email").doesNotExist());
    }
}
