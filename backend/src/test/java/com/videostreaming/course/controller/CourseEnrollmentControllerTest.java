package com.videostreaming.course.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.videostreaming.course.dto.CourseEnrollmentResponse;
import com.videostreaming.course.service.CourseEnrollmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CourseEnrollmentControllerTest {

    @Mock
    private CourseEnrollmentService courseEnrollmentService;

    @InjectMocks
    private CourseEnrollmentController controller;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();
    }

    private static UsernamePasswordAuthenticationToken authUser(String userId, String role) {
        return new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    private CourseEnrollmentResponse buildEnrollmentResponse(String id, String courseId) {
        CourseEnrollmentResponse response = new CourseEnrollmentResponse();
        response.setId(id);
        response.setCourseId(courseId);
        response.setCourseTitle("Test Course");
        response.setStudentUserId("student-1");
        response.setStudentDisplayName("Student Name");
        response.setStatus("ACTIVE");
        response.setPaidAmount(new BigDecimal("29.99"));
        response.setProgressPercentage(0.0);
        response.setEnrolledAt(LocalDateTime.of(2025, 3, 1, 10, 0));
        return response;
    }

    @Test
    void enroll_returns201() throws Exception {
        // given
        CourseEnrollmentResponse response = buildEnrollmentResponse("enrollment-1", "course-1");

        when(courseEnrollmentService.enroll(eq("course-1"), eq("student-1"), eq("pi_123"), any(BigDecimal.class)))
                .thenReturn(response);

        Map<String, Object> body = Map.of(
                "paymentIntentId", "pi_123",
                "paidAmount", "29.99");

        // when/then
        mockMvc.perform(post("/api/courses/course-1/enrollments")
                        .principal(authUser("student-1", "STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("enrollment-1"))
                .andExpect(jsonPath("$.courseId").value("course-1"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void cancelEnrollment_returns200() throws Exception {
        // given
        CourseEnrollmentResponse response = buildEnrollmentResponse("enrollment-1", "course-1");
        response.setStatus("CANCELLED");

        when(courseEnrollmentService.cancel("enrollment-1", "student-1")).thenReturn(response);

        // when/then
        mockMvc.perform(delete("/api/courses/course-1/enrollments/enrollment-1")
                        .principal(authUser("student-1", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("enrollment-1"))
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void getMyEnrollments_returns200() throws Exception {
        // given
        List<CourseEnrollmentResponse> enrollments = List.of(
                buildEnrollmentResponse("enrollment-1", "course-1"),
                buildEnrollmentResponse("enrollment-2", "course-2"));

        when(courseEnrollmentService.getMyEnrollments("student-1")).thenReturn(enrollments);

        // when/then
        mockMvc.perform(get("/api/enrollments/me")
                        .principal(authUser("student-1", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("enrollment-1"))
                .andExpect(jsonPath("$[0].courseId").value("course-1"))
                .andExpect(jsonPath("$[1].id").value("enrollment-2"))
                .andExpect(jsonPath("$[1].courseId").value("course-2"));
    }

    @Test
    void getCourseEnrollments_returns200() throws Exception {
        // given
        List<CourseEnrollmentResponse> enrollments = List.of(
                buildEnrollmentResponse("enrollment-1", "course-1"));

        when(courseEnrollmentService.getCourseEnrollments("course-1")).thenReturn(enrollments);

        // when/then
        mockMvc.perform(get("/api/courses/course-1/enrollments")
                        .principal(authUser("teacher-1", "TEACHER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("enrollment-1"))
                .andExpect(jsonPath("$[0].courseId").value("course-1"))
                .andExpect(jsonPath("$[0].studentDisplayName").value("Student Name"));
    }
}
