package com.videostreaming.live;

import com.fasterxml.jackson.databind.JsonNode;
import com.videostreaming.AbstractIntegrationTest;
import org.junit.jupiter.api.*;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class LiveSessionFlowIntegrationTest extends AbstractIntegrationTest {

    private String teacherToken;
    private String courseId;
    private String moduleId;
    private String sessionId;

    // -------------------------------------------------------------------------
    // 1. Setup: register teacher and create course
    // -------------------------------------------------------------------------

    @Test
    @Order(1)
    void setup() throws Exception {
        // Register teacher
        String teacherBody = objectMapper.writeValueAsString(Map.of(
                "email", "teacher.live@example.com",
                "password", "Password123!",
                "displayName", "Live Teacher",
                "role", "TEACHER",
                "headline", "Live Session Expert",
                "subjects", "Computer Science",
                "experienceYears", 4,
                "dateOfBirth", "1990-01-15"
        ));

        String teacherResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teacherBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();

        teacherToken = objectMapper.readTree(teacherResponse).get("token").asText();
        assertThat(teacherToken).isNotBlank();

        // Create course
        String courseBody = objectMapper.writeValueAsString(Map.of(
                "title", "Live Sessions Course",
                "description", "A course for testing live sessions",
                "subject", "Computer Science",
                "price", 0,
                "currency", "USD",
                "difficultyLevel", "INTERMEDIATE",
                "estimatedHours", 8
        ));

        String courseResponse = mockMvc.perform(post("/api/courses")
                        .header("Authorization", authHeader(teacherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(courseBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();

        courseId = objectMapper.readTree(courseResponse).get("id").asText();
        assertThat(courseId).isNotBlank();

        // Create module
        String moduleBody = objectMapper.writeValueAsString(Map.of(
                "title", "Module 1",
                "orderIndex", 0
        ));

        String moduleResponse = mockMvc.perform(post("/api/courses/{courseId}/modules", courseId)
                        .header("Authorization", authHeader(teacherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(moduleBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();

        moduleId = objectMapper.readTree(moduleResponse).get("id").asText();
        assertThat(moduleId).isNotBlank();

        // Publish the course (required before starting live sessions)
        mockMvc.perform(post("/api/courses/{courseId}/publish", courseId)
                        .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isOk());
    }

    // -------------------------------------------------------------------------
    // 2. Teacher schedules a live session
    // -------------------------------------------------------------------------

    @Test
    @Order(2)
    void scheduleSession() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "courseId", courseId,
                "moduleId", moduleId,
                "title", "Live Q&A",
                "description", "An interactive Q&A session",
                "scheduledAt", "2026-12-01T10:00:00",
                "durationMinutes", 60
        ));

        MvcResult result = mockMvc.perform(post("/api/live-sessions")
                        .header("Authorization", authHeader(teacherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Live Q&A"))
                .andExpect(jsonPath("$.courseId").value(courseId))
                .andExpect(jsonPath("$.durationMinutes").value(60))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        sessionId = json.get("id").asText();
        assertThat(sessionId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 3. Get sessions for course
    // -------------------------------------------------------------------------

    @Test
    @Order(3)
    void getSessionsForCourse() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/live-sessions")
                        .param("courseId", courseId)
                        .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.isArray()).isTrue();
        assertThat(json.size()).isGreaterThanOrEqualTo(1);

        boolean found = false;
        for (JsonNode session : json) {
            if (sessionId.equals(session.get("id").asText())) {
                found = true;
                assertThat(session.get("title").asText()).isEqualTo("Live Q&A");
                break;
            }
        }
        assertThat(found).as("Session list should contain the scheduled session").isTrue();
    }

    // -------------------------------------------------------------------------
    // 4. Teacher starts the session
    // -------------------------------------------------------------------------

    @Test
    @Order(4)
    void startSession() throws Exception {
        mockMvc.perform(post("/api/live-sessions/{id}/start", sessionId)
                        .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(sessionId))
                .andExpect(jsonPath("$.status").value("LIVE"));
    }

    // -------------------------------------------------------------------------
    // 5. Teacher ends the session
    // -------------------------------------------------------------------------

    @Test
    @Order(5)
    void endSession() throws Exception {
        mockMvc.perform(post("/api/live-sessions/{id}/end", sessionId)
                        .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(sessionId))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }
}
