package com.videostreaming.teacher;

import com.fasterxml.jackson.databind.JsonNode;
import com.videostreaming.AbstractIntegrationTest;
import com.videostreaming.auth.dto.RegisterRequest;
import org.junit.jupiter.api.*;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.isA;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class TeacherFlowIntegrationTest extends AbstractIntegrationTest {

    // Shared state across ordered tests
    private String teacherToken;
    private String teacherUserId;
    private String studentToken;

    // -------------------------------------------------------------------------
    // 1. Register a teacher via /api/auth/register (auto-creates TeacherProfile)
    // -------------------------------------------------------------------------

    @Test
    @Order(1)
    void registerTeacher() throws Exception {
        RegisterRequest teacherReq = new RegisterRequest(
                "teacher-flow@example.com",
                "Password123!",
                "Prof Flow",
                "TEACHER"
        );
        teacherReq.setHeadline("Expert in Mathematics");
        teacherReq.setSubjects("Math,Science");
        teacherReq.setExperienceYears(10);

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(teacherReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("teacher-flow@example.com"))
                .andExpect(jsonPath("$.role").value("TEACHER"))
                .andExpect(jsonPath("$.userId").isNotEmpty())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        teacherToken = json.get("token").asText();
        teacherUserId = json.get("userId").asText();

        assertThat(teacherToken).isNotBlank();
        assertThat(teacherUserId).isNotBlank();

        // Also register a student for later tests
        RegisterRequest studentReq = new RegisterRequest(
                "student-flow@example.com",
                "Password123!",
                "Sam Student",
                "STUDENT"
        );

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
    }

    // -------------------------------------------------------------------------
    // 2. Authenticated teacher retrieves their own teacher profile
    // -------------------------------------------------------------------------

    @Test
    @Order(2)
    void teacher_getOwnProfile_returns200() throws Exception {
        mockMvc.perform(get("/api/teachers/profile")
                        .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(teacherUserId))
                .andExpect(jsonPath("$.displayName").value("Prof Flow"))
                .andExpect(jsonPath("$.subjects").isNotEmpty());
    }

    // -------------------------------------------------------------------------
    // 3. Authenticated teacher updates their own teacher profile
    // -------------------------------------------------------------------------

    @Test
    @Order(3)
    void teacher_updateProfile_returns200() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "bio", "I have 10+ years of teaching Math and Science",
                "hourlyRate", 50,
                "headline", "Senior Math & Science Educator",
                "subjects", "Math,Science"
        ));

        mockMvc.perform(put("/api/teachers/profile")
                        .header("Authorization", authHeader(teacherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(teacherUserId))
                .andExpect(jsonPath("$.bio").value("I have 10+ years of teaching Math and Science"))
                .andExpect(jsonPath("$.hourlyRate").value(50.0))
                .andExpect(jsonPath("$.headline").value("Senior Math & Science Educator"))
                .andExpect(jsonPath("$.subjects").value("Math,Science"));
    }

    // -------------------------------------------------------------------------
    // 4. Public user retrieves teacher profile by userId
    // -------------------------------------------------------------------------

    @Test
    @Order(4)
    void publicUser_getTeacherProfile_returns200() throws Exception {
        mockMvc.perform(get("/api/teachers/{userId}", teacherUserId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(teacherUserId))
                .andExpect(jsonPath("$.displayName").value("Prof Flow"));
    }

    // -------------------------------------------------------------------------
    // 5. Public user lists all teachers; optionally filters by subject
    // -------------------------------------------------------------------------

    @Test
    @Order(5)
    void publicUser_listTeachers_returns200() throws Exception {
        // List all teachers
        MvcResult listResult = mockMvc.perform(get("/api/teachers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andReturn();

        JsonNode list = objectMapper.readTree(listResult.getResponse().getContentAsString());
        assertThat(list.isArray()).isTrue();

        boolean found = false;
        for (JsonNode teacher : list) {
            if (teacherUserId.equals(teacher.get("userId").asText())) {
                found = true;
                break;
            }
        }
        assertThat(found).as("Teacher list should contain the registered teacher").isTrue();

        // Filter by subject
        mockMvc.perform(get("/api/teachers").param("subject", "Math"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)));
    }

    // -------------------------------------------------------------------------
    // 6. Student submits a teacher application
    // -------------------------------------------------------------------------

    @Test
    @Order(6)
    void student_submitTeacherApplication_returns200() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "notes", "I want to teach Math and help students succeed"
        ));

        mockMvc.perform(post("/api/teacher-applications")
                        .header("Authorization", authHeader(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.status").isNotEmpty())
                .andExpect(jsonPath("$.notes").value("I want to teach Math and help students succeed"));
    }

    // -------------------------------------------------------------------------
    // 7. Student retrieves the status of their own teacher application
    // -------------------------------------------------------------------------

    @Test
    @Order(7)
    void student_getApplicationStatus_returns200() throws Exception {
        mockMvc.perform(get("/api/teacher-applications/me")
                        .header("Authorization", authHeader(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.status").isNotEmpty())
                .andExpect(jsonPath("$.notes").value("I want to teach Math and help students succeed"));
    }
}
