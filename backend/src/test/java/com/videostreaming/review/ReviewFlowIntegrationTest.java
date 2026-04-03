package com.videostreaming.review;

import com.fasterxml.jackson.databind.JsonNode;
import com.videostreaming.AbstractIntegrationTest;
import com.videostreaming.auth.dto.RegisterRequest;
import org.junit.jupiter.api.*;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ReviewFlowIntegrationTest extends AbstractIntegrationTest {

    // Shared state across ordered tests
    private String teacherToken;
    private String teacherUserId;
    private String studentToken;
    private String classId;
    private String reviewId;

    // -------------------------------------------------------------------------
    // 1. Setup: register a teacher and a student
    // -------------------------------------------------------------------------

    @Test
    @Order(1)
    void setup() throws Exception {
        // Register teacher
        RegisterRequest teacherReq = new RegisterRequest(
                "teacher-review@example.com",
                "Password123!",
                "Prof Review",
                "TEACHER"
        );
        teacherReq.setDateOfBirth(java.time.LocalDate.of(1990, 1, 15));
        teacherReq.setHeadline("Experienced Educator");
        teacherReq.setSubjects("Mathematics");
        teacherReq.setExperienceYears(8);

        MvcResult teacherResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(teacherReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("TEACHER"))
                .andReturn();

        JsonNode teacherJson = objectMapper.readTree(
                teacherResult.getResponse().getContentAsString());
        teacherToken = teacherJson.get("token").asText();
        teacherUserId = teacherJson.get("userId").asText();

        assertThat(teacherToken).isNotBlank();
        assertThat(teacherUserId).isNotBlank();

        // Register student
        RegisterRequest studentReq = new RegisterRequest(
                "student-review@example.com",
                "Password123!",
                "Sara Student",
                "STUDENT"
        );
        studentReq.setDateOfBirth(java.time.LocalDate.of(1990, 1, 15));

        MvcResult studentResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(studentReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andReturn();

        studentToken = objectMapper.readTree(
                studentResult.getResponse().getContentAsString()).get("token").asText();

        assertThat(studentToken).isNotBlank();

        // Create a scheduled class so the student can review it
        String classBody = objectMapper.writeValueAsString(Map.of(
                "title", "Review Test Class",
                "description", "A class for review testing",
                "subject", "Mathematics",
                "scheduledAt", "2026-12-01T10:00:00",
                "durationMinutes", 60,
                "maxStudents", 20,
                "price", 0,
                "currency", "USD"
        ));

        MvcResult classResult = mockMvc.perform(post("/api/classes")
                        .header("Authorization", authHeader(teacherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(classBody))
                .andExpect(status().isOk())
                .andReturn();

        classId = objectMapper.readTree(
                classResult.getResponse().getContentAsString()).get("id").asText();
        assertThat(classId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 2. Authenticated student submits a review for the teacher
    // -------------------------------------------------------------------------

    @Test
    @Order(2)
    void student_createReview_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "classId", classId,
                "rating", 5,
                "comment", "Great teacher, very clear explanations!"
        ));

        MvcResult result = mockMvc.perform(post("/api/reviews")
                        .param("teacherId", teacherUserId)
                        .header("Authorization", authHeader(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.teacherUserId").value(teacherUserId))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.comment").value("Great teacher, very clear explanations!"))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        reviewId = json.get("id").asText();

        assertThat(reviewId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 3. Public user lists reviews for the teacher (no auth needed)
    // -------------------------------------------------------------------------

    @Test
    @Order(3)
    void publicUser_getReviews_returns200() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/reviews")
                        .param("teacherId", teacherUserId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.isArray()).isTrue();

        boolean found = false;
        for (JsonNode review : json) {
            if (reviewId.equals(review.get("id").asText())) {
                found = true;
                assertThat(review.get("rating").asInt()).isEqualTo(5);
                assertThat(review.get("comment").asText())
                        .isEqualTo("Great teacher, very clear explanations!");
                break;
            }
        }
        assertThat(found).as("Review list should contain the submitted review").isTrue();
    }

    // -------------------------------------------------------------------------
    // 4. Authenticated teacher replies to the review
    // -------------------------------------------------------------------------

    @Test
    @Order(4)
    void teacher_replyToReview_returns200() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "reply", "Thank you for the kind words!"
        ));

        mockMvc.perform(post("/api/reviews/{reviewId}/reply", reviewId)
                        .header("Authorization", authHeader(teacherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(reviewId))
                .andExpect(jsonPath("$.teacherReply").value("Thank you for the kind words!"))
                .andExpect(jsonPath("$.teacherRepliedAt").isNotEmpty());
    }

    // -------------------------------------------------------------------------
    // 5. Authenticated student marks the review as helpful
    // -------------------------------------------------------------------------

    @Test
    @Order(5)
    void student_markReviewHelpful_returns200() throws Exception {
        mockMvc.perform(post("/api/reviews/{reviewId}/helpful", reviewId)
                        .header("Authorization", authHeader(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(reviewId))
                .andExpect(jsonPath("$.helpfulCount").value(1));
    }
}
