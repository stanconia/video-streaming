package com.videostreaming.discussion;

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
class DiscussionFlowIntegrationTest extends AbstractIntegrationTest {

    private String teacherToken;
    private String studentToken;
    private String courseId;
    private String threadId;

    // -------------------------------------------------------------------------
    // 1. Setup: register teacher and student, create course, enroll student
    // -------------------------------------------------------------------------

    @Test
    @Order(1)
    void setup() throws Exception {
        // Register teacher
        String teacherBody = objectMapper.writeValueAsString(Map.of(
                "email", "teacher.discussion@example.com",
                "password", "Password123!",
                "displayName", "Discussion Teacher",
                "role", "TEACHER",
                "headline", "Discussion Expert",
                "subjects", "General",
                "experienceYears", 3
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

        // Register student
        String studentBody = objectMapper.writeValueAsString(Map.of(
                "email", "student.discussion@example.com",
                "password", "Password123!",
                "displayName", "Discussion Student",
                "role", "STUDENT"
        ));

        String studentResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(studentBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();

        studentToken = objectMapper.readTree(studentResponse).get("token").asText();
        assertThat(studentToken).isNotBlank();

        // Teacher creates a course
        String courseBody = objectMapper.writeValueAsString(Map.of(
                "title", "Discussion Course",
                "description", "A course for testing discussions",
                "subject", "General",
                "price", 0,
                "currency", "USD",
                "difficultyLevel", "BEGINNER",
                "estimatedHours", 5
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

        // Enroll student in the course (required to post discussions)
        String enrollBody = objectMapper.writeValueAsString(Map.of("paidAmount", 0));

        mockMvc.perform(post("/api/courses/{courseId}/enrollments", courseId)
                        .header("Authorization", authHeader(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(enrollBody))
                .andExpect(status().isCreated());
    }

    // -------------------------------------------------------------------------
    // 2. Authenticated user creates a discussion thread
    // -------------------------------------------------------------------------

    @Test
    @Order(2)
    void createThread() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Question",
                "content", "I need help"
        ));

        MvcResult result = mockMvc.perform(post("/api/courses/{courseId}/discussions", courseId)
                        .header("Authorization", authHeader(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Question"))
                .andExpect(jsonPath("$.content").value("I need help"))
                .andExpect(jsonPath("$.courseId").value(courseId))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        threadId = json.get("id").asText();
        assertThat(threadId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 3. List discussion threads for the course
    // -------------------------------------------------------------------------

    @Test
    @Order(3)
    void listThreads() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/courses/{courseId}/discussions", courseId)
                        .header("Authorization", authHeader(studentToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.isArray()).isTrue();
        assertThat(json.size()).isGreaterThanOrEqualTo(1);

        boolean found = false;
        for (JsonNode thread : json) {
            if (threadId.equals(thread.get("id").asText())) {
                found = true;
                assertThat(thread.get("title").asText()).isEqualTo("Question");
                break;
            }
        }
        assertThat(found).as("Thread list should contain the created thread").isTrue();
    }

    // -------------------------------------------------------------------------
    // 4. Teacher adds a reply to the thread
    // -------------------------------------------------------------------------

    @Test
    @Order(4)
    void addReply() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "content", "Here's the answer"
        ));

        mockMvc.perform(
                        post("/api/courses/{courseId}/discussions/{threadId}/replies", courseId, threadId)
                                .header("Authorization", authHeader(teacherToken))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.threadId").value(threadId))
                .andExpect(jsonPath("$.content").value("Here's the answer"));
    }

    // -------------------------------------------------------------------------
    // 5. Get replies for the thread
    // -------------------------------------------------------------------------

    @Test
    @Order(5)
    void getReplies() throws Exception {
        MvcResult result = mockMvc.perform(
                        get("/api/courses/{courseId}/discussions/{threadId}/replies", courseId, threadId)
                                .header("Authorization", authHeader(studentToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.isArray()).isTrue();
        assertThat(json.size()).isGreaterThanOrEqualTo(1);
        assertThat(json.get(0).get("content").asText()).isEqualTo("Here's the answer");
    }

    // -------------------------------------------------------------------------
    // 6. Student deletes their own thread
    // -------------------------------------------------------------------------

    @Test
    @Order(6)
    void deleteThread() throws Exception {
        mockMvc.perform(
                        delete("/api/courses/{courseId}/discussions/{threadId}", courseId, threadId)
                                .header("Authorization", authHeader(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Thread deleted"));
    }
}
