package com.videostreaming.quiz;

import com.fasterxml.jackson.databind.JsonNode;
import com.videostreaming.AbstractIntegrationTest;
import com.videostreaming.user.model.UserRole;
import org.junit.jupiter.api.*;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class LearningActivitiesIntegrationTest extends AbstractIntegrationTest {

    private String teacherToken;
    private String studentToken;
    private String courseId;
    private String moduleId;
    private String quizId;
    private String questionId;
    private String assignmentId;
    private String submissionId;

    // -------------------------------------------------------------------------
    // 1. Setup: register teacher and student, create course and module
    // -------------------------------------------------------------------------

    @Test
    @Order(1)
    void setup() throws Exception {
        // Register teacher via /api/auth/register
        String teacherBody = objectMapper.writeValueAsString(Map.of(
                "email", "teacher.activities@example.com",
                "password", "Password123!",
                "displayName", "Activities Teacher",
                "role", "TEACHER",
                "headline", "Expert Educator",
                "subjects", "Mathematics",
                "experienceYears", 5
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
                "email", "student.activities@example.com",
                "password", "Password123!",
                "displayName", "Activities Student",
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

        // Create course
        String courseBody = objectMapper.writeValueAsString(Map.of(
                "title", "Learning Activities Course",
                "description", "A course for testing learning activities",
                "subject", "Mathematics",
                "price", 0,
                "currency", "USD",
                "difficultyLevel", "BEGINNER",
                "estimatedHours", 10
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
    }

    // -------------------------------------------------------------------------
    // 2. Teacher creates a quiz
    // -------------------------------------------------------------------------

    @Test
    @Order(2)
    void createQuiz() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Quiz 1",
                "description", "Test quiz",
                "passPercentage", 70,
                "orderIndex", 0
        ));

        MvcResult result = mockMvc.perform(
                        post("/api/courses/{courseId}/modules/{moduleId}/quizzes", courseId, moduleId)
                                .header("Authorization", authHeader(teacherToken))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Quiz 1"))
                .andExpect(jsonPath("$.moduleId").value(moduleId))
                .andExpect(jsonPath("$.courseId").value(courseId))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        quizId = json.get("id").asText();
        assertThat(quizId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 3. Teacher adds a question to the quiz
    // -------------------------------------------------------------------------

    @Test
    @Order(3)
    void addQuestion() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "questionText", "What is 2+2?",
                "options", List.of("3", "4", "5", "6"),
                "correctOptionIndex", 1,
                "points", 10
        ));

        MvcResult result = mockMvc.perform(
                        post("/api/courses/{courseId}/quizzes/{quizId}/questions", courseId, quizId)
                                .header("Authorization", authHeader(teacherToken))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.questionText").value("What is 2+2?"))
                .andExpect(jsonPath("$.points").value(10))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        questionId = json.get("id").asText();
        assertThat(questionId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 4. List questions for the quiz
    // -------------------------------------------------------------------------

    @Test
    @Order(4)
    void listQuestions() throws Exception {
        MvcResult result = mockMvc.perform(
                        get("/api/courses/{courseId}/quizzes/{quizId}/questions", courseId, quizId)
                                .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.isArray()).isTrue();
        assertThat(json.size()).isGreaterThanOrEqualTo(1);

        boolean found = false;
        for (JsonNode q : json) {
            if (questionId.equals(q.get("id").asText())) {
                found = true;
                assertThat(q.get("questionText").asText()).isEqualTo("What is 2+2?");
                break;
            }
        }
        assertThat(found).as("Question list should contain the created question").isTrue();
    }

    // -------------------------------------------------------------------------
    // 5. Student submits an attempt
    // -------------------------------------------------------------------------

    @Test
    @Order(5)
    void studentSubmitAttempt() throws Exception {
        // answers field is a raw string in the controller: body.get("answers")
        String body = objectMapper.writeValueAsString(Map.of(
                "answers", questionId + ":1"
        ));

        mockMvc.perform(
                        post("/api/courses/{courseId}/quizzes/{quizId}/attempts", courseId, quizId)
                                .header("Authorization", authHeader(studentToken))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.quizId").value(quizId))
                .andExpect(jsonPath("$.score").isNumber())
                .andExpect(jsonPath("$.totalPoints").isNumber());
    }

    // -------------------------------------------------------------------------
    // 6. Student gets their own attempts
    // -------------------------------------------------------------------------

    @Test
    @Order(6)
    void getMyAttempts() throws Exception {
        MvcResult result = mockMvc.perform(
                        get("/api/courses/{courseId}/quizzes/{quizId}/attempts/mine", courseId, quizId)
                                .header("Authorization", authHeader(studentToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.isArray()).isTrue();
        assertThat(json.size()).isGreaterThanOrEqualTo(1);
        assertThat(json.get(0).get("quizId").asText()).isEqualTo(quizId);
    }

    // -------------------------------------------------------------------------
    // 7. Teacher creates an assignment
    // -------------------------------------------------------------------------

    @Test
    @Order(7)
    void createAssignment() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Assignment 1",
                "description", "Write essay",
                "maxScore", 100,
                "dueDate", "2026-12-01T23:59:59",
                "orderIndex", 0
        ));

        MvcResult result = mockMvc.perform(
                        post("/api/courses/{courseId}/modules/{moduleId}/assignments", courseId, moduleId)
                                .header("Authorization", authHeader(teacherToken))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Assignment 1"))
                .andExpect(jsonPath("$.moduleId").value(moduleId))
                .andExpect(jsonPath("$.courseId").value(courseId))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assignmentId = json.get("id").asText();
        assertThat(assignmentId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 8. Student submits an assignment
    // -------------------------------------------------------------------------

    @Test
    @Order(8)
    void studentSubmitAssignment() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "content", "My answer"
        ));

        MvcResult result = mockMvc.perform(
                        post("/api/courses/{courseId}/assignments/{assignmentId}/submit",
                                courseId, assignmentId)
                                .header("Authorization", authHeader(studentToken))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.assignmentId").value(assignmentId))
                .andExpect(jsonPath("$.content").value("My answer"))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        submissionId = json.get("id").asText();
        assertThat(submissionId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 9. Teacher grades the submission
    // -------------------------------------------------------------------------

    @Test
    @Order(9)
    void teacherGradeAssignment() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "score", 85,
                "feedback", "Good"
        ));

        mockMvc.perform(
                        post("/api/courses/{courseId}/submissions/{submissionId}/grade",
                                courseId, submissionId)
                                .header("Authorization", authHeader(teacherToken))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(submissionId))
                .andExpect(jsonPath("$.score").value(85))
                .andExpect(jsonPath("$.feedback").value("Good"));
    }

    // -------------------------------------------------------------------------
    // 10. Student retrieves their own submission
    // -------------------------------------------------------------------------

    @Test
    @Order(10)
    void getMySubmission() throws Exception {
        mockMvc.perform(
                        get("/api/courses/{courseId}/assignments/{assignmentId}/my-submission",
                                courseId, assignmentId)
                                .header("Authorization", authHeader(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(submissionId))
                .andExpect(jsonPath("$.assignmentId").value(assignmentId));
    }
}
