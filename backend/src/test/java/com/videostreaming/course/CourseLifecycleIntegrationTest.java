package com.videostreaming.course;

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
class CourseLifecycleIntegrationTest extends AbstractIntegrationTest {

    // Shared state across ordered tests
    private String teacherToken;
    private String studentToken;
    private String courseId;
    private String moduleId;
    private String lessonId;

    // -------------------------------------------------------------------------
    // 1. Setup: register teacher and student via the real auth endpoint
    // -------------------------------------------------------------------------

    @Test
    @Order(1)
    void setup_registerTeacherAndStudent() throws Exception {
        // Register teacher
        String teacherBody = objectMapper.writeValueAsString(Map.of(
                "email", "teacher.lifecycle@example.com",
                "password", "Password123!",
                "displayName", "Lifecycle Teacher",
                "role", "TEACHER",
                "headline", "Expert Educator",
                "subjects", "Mathematics",
                "experienceYears", 5,
                "dateOfBirth", "1990-01-15"
        ));

        MvcResult teacherResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teacherBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        JsonNode teacherJson = objectMapper.readTree(
                teacherResult.getResponse().getContentAsString());
        teacherToken = teacherJson.get("token").asText();
        assertThat(teacherToken).isNotBlank();

        // Register student
        String studentBody = objectMapper.writeValueAsString(Map.of(
                "email", "student.lifecycle@example.com",
                "password", "Password123!",
                "displayName", "Lifecycle Student",
                "role", "STUDENT",
                "dateOfBirth", "1990-01-15"
        ));

        MvcResult studentResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(studentBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        JsonNode studentJson = objectMapper.readTree(
                studentResult.getResponse().getContentAsString());
        studentToken = studentJson.get("token").asText();
        assertThat(studentToken).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 2. Teacher creates a course
    // -------------------------------------------------------------------------

    @Test
    @Order(2)
    void teacher_createCourse_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Introduction to Algebra",
                "description", "A beginner course on algebraic fundamentals",
                "subject", "Mathematics",
                "price", 0,
                "currency", "USD",
                "difficultyLevel", "BEGINNER",
                "estimatedHours", 10
        ));

        MvcResult result = mockMvc.perform(post("/api/courses")
                        .header("Authorization", authHeader(teacherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Introduction to Algebra"))
                .andExpect(jsonPath("$.published").value(false))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        courseId = json.get("id").asText();
        assertThat(courseId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 3. Teacher adds a module to the course
    // -------------------------------------------------------------------------

    @Test
    @Order(3)
    void teacher_addModule_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Module 1",
                "orderIndex", 0
        ));

        MvcResult result = mockMvc.perform(post("/api/courses/{courseId}/modules", courseId)
                        .header("Authorization", authHeader(teacherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Module 1"))
                .andExpect(jsonPath("$.courseId").value(courseId))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        moduleId = json.get("id").asText();
        assertThat(moduleId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 4. Teacher adds a lesson to the module
    // -------------------------------------------------------------------------

    @Test
    @Order(4)
    void teacher_addLesson_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Lesson 1",
                "type", "VIDEO",
                "content", "https://example.com/lesson1-video",
                "estimatedMinutes", 30,
                "orderIndex", 0
        ));

        MvcResult result = mockMvc.perform(
                        post("/api/courses/{courseId}/modules/{moduleId}/lessons", courseId, moduleId)
                                .header("Authorization", authHeader(teacherToken))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Lesson 1"))
                .andExpect(jsonPath("$.type").value("VIDEO"))
                .andExpect(jsonPath("$.moduleId").value(moduleId))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        lessonId = json.get("id").asText();
        assertThat(lessonId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 5. Teacher publishes the course
    // -------------------------------------------------------------------------

    @Test
    @Order(5)
    void teacher_publishCourse_returns200() throws Exception {
        mockMvc.perform(post("/api/courses/{courseId}/publish", courseId)
                        .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(courseId))
                .andExpect(jsonPath("$.published").value(true));
    }

    // -------------------------------------------------------------------------
    // 6. Teacher lists their own courses
    // -------------------------------------------------------------------------

    @Test
    @Order(6)
    void teacher_getMyCoursesIncludesCourse() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/courses/my")
                        .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.isArray()).isTrue();

        boolean found = false;
        for (JsonNode course : json) {
            if (courseId.equals(course.get("id").asText())) {
                found = true;
                assertThat(course.get("title").asText()).isEqualTo("Introduction to Algebra");
                break;
            }
        }
        assertThat(found).as("Teacher's course list should contain the created course").isTrue();
    }

    // -------------------------------------------------------------------------
    // 7. Public: list courses includes the published course
    // -------------------------------------------------------------------------

    @Test
    @Order(7)
    void publicUser_getCourseList_includesPublishedCourse() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/courses"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.isArray()).isTrue();

        boolean found = false;
        for (JsonNode course : json) {
            if (courseId.equals(course.get("id").asText())) {
                found = true;
                assertThat(course.get("published").asBoolean()).isTrue();
                break;
            }
        }
        assertThat(found).as("Public course list should contain the published course").isTrue();
    }

    // -------------------------------------------------------------------------
    // 8. Student enrolls in the free course
    // -------------------------------------------------------------------------

    @Test
    @Order(8)
    void student_enrollInFreeCourse_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "paidAmount", 0
        ));

        mockMvc.perform(post("/api/courses/{courseId}/enrollments", courseId)
                        .header("Authorization", authHeader(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.courseId").value(courseId))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    // -------------------------------------------------------------------------
    // 9. Student cannot enroll again in the same course (duplicate)
    // -------------------------------------------------------------------------

    @Test
    @Order(9)
    void student_duplicateEnrollment_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "paidAmount", 0
        ));

        mockMvc.perform(post("/api/courses/{courseId}/enrollments", courseId)
                        .header("Authorization", authHeader(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").isNotEmpty());
    }

    // -------------------------------------------------------------------------
    // 10. Student retrieves their enrollments
    // -------------------------------------------------------------------------

    @Test
    @Order(10)
    void student_getMyEnrollments_includesEnrollment() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/enrollments/me")
                        .header("Authorization", authHeader(studentToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.isArray()).isTrue();

        boolean found = false;
        for (JsonNode enrollment : json) {
            if (courseId.equals(enrollment.get("courseId").asText())) {
                found = true;
                assertThat(enrollment.get("status").asText()).isEqualTo("ACTIVE");
                break;
            }
        }
        assertThat(found).as("Student enrollments should include enrollment for the course").isTrue();
    }

    // -------------------------------------------------------------------------
    // 11. Student marks the lesson as complete
    // -------------------------------------------------------------------------

    @Test
    @Order(11)
    void student_markLessonComplete_returns200() throws Exception {
        mockMvc.perform(post("/api/courses/{courseId}/lessons/{lessonId}/complete", courseId, lessonId)
                        .header("Authorization", authHeader(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Lesson marked as complete"));
    }

    // -------------------------------------------------------------------------
    // 12. Student checks course progress (should be 100% - only 1 lesson)
    // -------------------------------------------------------------------------

    @Test
    @Order(12)
    void student_getCourseProgress_shows100Percent() throws Exception {
        mockMvc.perform(get("/api/courses/{courseId}/progress", courseId)
                        .header("Authorization", authHeader(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courseId").value(courseId))
                .andExpect(jsonPath("$.totalLessons").value(1))
                .andExpect(jsonPath("$.completedLessons").value(1))
                .andExpect(jsonPath("$.progressPercentage").value(100.0));
    }

    // -------------------------------------------------------------------------
    // 13. Search finds the published course by keyword
    // -------------------------------------------------------------------------

    @Test
    @Order(13)
    void searchCourses_findsPublishedCourse() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/courses/search")
                        .param("q", "Algebra"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode content = json.get("content");
        assertThat(content).isNotNull();

        boolean found = false;
        for (JsonNode course : content) {
            if (courseId.equals(course.get("id").asText())) {
                found = true;
                assertThat(course.get("title").asText()).isEqualTo("Introduction to Algebra");
                break;
            }
        }
        assertThat(found).as("Search results should contain the published course").isTrue();
    }

    // -------------------------------------------------------------------------
    // 14. Teacher updates the course
    // -------------------------------------------------------------------------

    @Test
    @Order(14)
    void teacher_updateCourse_returns200() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Introduction to Algebra (Updated)",
                "description", "Updated description for the algebra course",
                "subject", "Mathematics",
                "price", 0,
                "currency", "USD",
                "difficultyLevel", "BEGINNER",
                "estimatedHours", 12
        ));

        mockMvc.perform(put("/api/courses/{courseId}", courseId)
                        .header("Authorization", authHeader(teacherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(courseId))
                .andExpect(jsonPath("$.title").value("Introduction to Algebra (Updated)"))
                .andExpect(jsonPath("$.estimatedHours").value(12));
    }

    // -------------------------------------------------------------------------
    // 15. Teacher deletes the course
    // -------------------------------------------------------------------------

    @Test
    @Order(15)
    void teacher_deleteCourse_returns200() throws Exception {
        mockMvc.perform(delete("/api/courses/{courseId}", courseId)
                        .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Course deleted"));
    }
}
