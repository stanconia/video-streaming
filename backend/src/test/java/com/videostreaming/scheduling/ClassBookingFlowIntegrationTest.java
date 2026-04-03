package com.videostreaming.scheduling;

import com.fasterxml.jackson.databind.JsonNode;
import com.videostreaming.AbstractIntegrationTest;
import com.videostreaming.auth.dto.RegisterRequest;
import com.videostreaming.payment.service.EscrowPaymentService;
import com.videostreaming.user.model.UserRole;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ClassBookingFlowIntegrationTest extends AbstractIntegrationTest {

    @MockBean
    private EscrowPaymentService escrowPaymentService;

    private String teacherToken;
    private String studentToken;
    private String classId;
    private String bookingId;

    // -------------------------------------------------------------------------
    // 1. Setup: register teacher (with TeacherProfile) and student via /api/auth/register
    // -------------------------------------------------------------------------

    @Test
    @Order(1)
    void setup_registerTeacherAndStudent() throws Exception {
        // Register teacher - /api/auth/register auto-creates TeacherProfile for TEACHER role
        RegisterRequest teacherReq = new RegisterRequest(
                "teacher-booking@example.com",
                "Password123!",
                "Prof Booking",
                "TEACHER"
        );
        teacherReq.setDateOfBirth(java.time.LocalDate.of(1990, 1, 15));
        teacherReq.setHeadline("Expert Math Teacher");
        teacherReq.setSubjects("Math, Algebra");
        teacherReq.setExperienceYears(5);

        String teacherResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(teacherReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("TEACHER"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        teacherToken = objectMapper.readTree(teacherResponse).get("token").asText();

        // Register student
        RegisterRequest studentReq = new RegisterRequest(
                "student-booking@example.com",
                "Password123!",
                "Sam Student",
                "STUDENT"
        );
        studentReq.setDateOfBirth(java.time.LocalDate.of(1990, 1, 15));

        String studentResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(studentReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        studentToken = objectMapper.readTree(studentResponse).get("token").asText();
    }

    // -------------------------------------------------------------------------
    // 2. Teacher creates a scheduled class
    // -------------------------------------------------------------------------

    @Test
    @Order(2)
    void teacher_createClass_returns200() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("title", "Introduction to Algebra");
        body.put("description", "A beginner-friendly algebra class");
        body.put("subject", "Math");
        body.put("scheduledAt", "2026-12-01T10:00:00");
        body.put("durationMinutes", 60);
        body.put("maxStudents", 30);
        body.put("price", 0.0);
        body.put("currency", "USD");

        String response = mockMvc.perform(post("/api/classes")
                        .header("Authorization", authHeader(teacherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Introduction to Algebra"))
                .andExpect(jsonPath("$.subject").value("Math"))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.price").value(0.0))
                .andExpect(jsonPath("$.maxStudents").value(30))
                .andReturn()
                .getResponse()
                .getContentAsString();

        classId = objectMapper.readTree(response).get("id").asText();
    }

    // -------------------------------------------------------------------------
    // 3. Public user lists upcoming classes and sees the created class
    // -------------------------------------------------------------------------

    @Test
    @Order(3)
    void publicUser_listClasses_includesClass() throws Exception {
        mockMvc.perform(get("/api/classes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)))
                .andExpect(jsonPath("$[?(@.id == '" + classId + "')]").exists())
                .andExpect(jsonPath("$[?(@.id == '" + classId + "')].title",
                        hasItem("Introduction to Algebra")));
    }

    // -------------------------------------------------------------------------
    // 4. Student books the free class
    // -------------------------------------------------------------------------

    @Test
    @Order(4)
    void student_bookFreeClass_returns200() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("classId", classId);
        body.put("paymentIntentId", null);

        String response = mockMvc.perform(post("/api/bookings")
                        .header("Authorization", authHeader(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.classId").value(classId))
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.paidAmount").value(0.0))
                .andReturn()
                .getResponse()
                .getContentAsString();

        bookingId = objectMapper.readTree(response).get("id").asText();
    }

    // -------------------------------------------------------------------------
    // 5. Student retrieves their bookings and sees the booking
    // -------------------------------------------------------------------------

    @Test
    @Order(5)
    void student_getMyBookings_includesBooking() throws Exception {
        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", authHeader(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)))
                .andExpect(jsonPath("$[?(@.id == '" + bookingId + "')]").exists())
                .andExpect(jsonPath("$[?(@.id == '" + bookingId + "')].status",
                        hasItem("CONFIRMED")));
    }

    // -------------------------------------------------------------------------
    // 6. Student tries to book the same class again - expects error
    // -------------------------------------------------------------------------

    @Test
    @Order(6)
    void student_duplicateBooking_returnsError() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("classId", classId);
        body.put("paymentIntentId", null);

        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", authHeader(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").isNotEmpty());
    }

    // -------------------------------------------------------------------------
    // 7. Teacher starts the class
    // -------------------------------------------------------------------------

    @Test
    @Order(7)
    void teacher_startClass_returns200() throws Exception {
        mockMvc.perform(post("/api/classes/" + classId + "/start")
                        .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(classId))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    // -------------------------------------------------------------------------
    // 8. Teacher completes the class
    // -------------------------------------------------------------------------

    @Test
    @Order(8)
    void teacher_completeClass_returns200() throws Exception {
        mockMvc.perform(post("/api/classes/" + classId + "/complete")
                        .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(classId))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    // -------------------------------------------------------------------------
    // 9. Cancel booking flow: create new class -> book it -> cancel booking
    // -------------------------------------------------------------------------

    @Test
    @Order(9)
    void cancelBookingFlow() throws Exception {
        // Create a new class for this flow
        Map<String, Object> classBody = new HashMap<>();
        classBody.put("title", "Geometry Basics");
        classBody.put("description", "A class about geometry fundamentals");
        classBody.put("subject", "Math");
        classBody.put("scheduledAt", "2026-12-05T14:00:00");
        classBody.put("durationMinutes", 45);
        classBody.put("maxStudents", 20);
        classBody.put("price", 0.0);
        classBody.put("currency", "USD");

        String classResponse = mockMvc.perform(post("/api/classes")
                        .header("Authorization", authHeader(teacherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String cancelClassId = objectMapper.readTree(classResponse).get("id").asText();

        // Student books the new class
        Map<String, Object> bookingBody = new HashMap<>();
        bookingBody.put("classId", cancelClassId);
        bookingBody.put("paymentIntentId", null);

        String bookingResponse = mockMvc.perform(post("/api/bookings")
                        .header("Authorization", authHeader(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String cancelBookingId = objectMapper.readTree(bookingResponse).get("id").asText();

        // Student cancels the booking
        mockMvc.perform(delete("/api/bookings/" + cancelBookingId)
                        .header("Authorization", authHeader(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(cancelBookingId))
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    // -------------------------------------------------------------------------
    // 10. Teacher cancels a class: create new class -> cancel it
    // -------------------------------------------------------------------------

    @Test
    @Order(10)
    void teacher_cancelClass_returns200() throws Exception {
        // Create a new class to cancel
        Map<String, Object> classBody = new HashMap<>();
        classBody.put("title", "Trigonometry Advanced");
        classBody.put("description", "Advanced trigonometry topics");
        classBody.put("subject", "Math");
        classBody.put("scheduledAt", "2026-12-10T09:00:00");
        classBody.put("durationMinutes", 90);
        classBody.put("maxStudents", 15);
        classBody.put("price", 0.0);
        classBody.put("currency", "USD");

        String classResponse = mockMvc.perform(post("/api/classes")
                        .header("Authorization", authHeader(teacherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String cancelClassId = objectMapper.readTree(classResponse).get("id").asText();

        // Teacher cancels the class
        mockMvc.perform(delete("/api/classes/" + cancelClassId)
                        .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(cancelClassId))
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    // -------------------------------------------------------------------------
    // 11. Search classes finds the created class by keyword
    // -------------------------------------------------------------------------

    @Test
    @Order(11)
    void searchClasses_findsClass() throws Exception {
        mockMvc.perform(get("/api/classes/search")
                        .param("q", "Geometry"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[?(@.title =~ /.*Geometry.*/)]").exists());
    }
}
