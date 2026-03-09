package com.videostreaming.course.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.videostreaming.course.dto.CourseResponse;
import com.videostreaming.course.dto.CreateCourseRequest;
import com.videostreaming.course.service.CourseService;
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
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CourseControllerTest {

    @Mock
    private CourseService courseService;

    @InjectMocks
    private CourseController controller;

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

    private CourseResponse buildCourseResponse(String id, String title) {
        CourseResponse response = new CourseResponse();
        response.setId(id);
        response.setTeacherUserId("teacher-1");
        response.setTeacherDisplayName("Teacher Name");
        response.setTitle(title);
        response.setDescription("A test course");
        response.setSubject("Mathematics");
        response.setPrice(new BigDecimal("29.99"));
        response.setCurrency("USD");
        response.setDifficultyLevel("BEGINNER");
        response.setEstimatedHours(10);
        response.setPublished(true);
        response.setModuleCount(3);
        response.setLessonCount(15);
        response.setEnrolledCount(42);
        response.setCreatedAt(LocalDateTime.of(2025, 1, 15, 10, 0));
        return response;
    }

    private CreateCourseRequest buildCreateCourseRequest() {
        CreateCourseRequest request = new CreateCourseRequest();
        request.setTitle("New Course");
        request.setDescription("Course description");
        request.setSubject("Mathematics");
        request.setPrice(new BigDecimal("29.99"));
        request.setCurrency("USD");
        request.setDifficultyLevel("BEGINNER");
        request.setEstimatedHours(10);
        return request;
    }

    @Test
    void getCourses_returns200() throws Exception {
        // given
        List<CourseResponse> courses = List.of(
                buildCourseResponse("course-1", "Course One"),
                buildCourseResponse("course-2", "Course Two"));

        when(courseService.getCourses()).thenReturn(courses);

        // when/then
        mockMvc.perform(get("/api/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("course-1"))
                .andExpect(jsonPath("$[0].title").value("Course One"))
                .andExpect(jsonPath("$[1].id").value("course-2"))
                .andExpect(jsonPath("$[1].title").value("Course Two"));
    }

    @Test
    void getCourse_found_returns200() throws Exception {
        // given
        CourseResponse course = buildCourseResponse("course-1", "Test Course");

        when(courseService.getCourse("course-1")).thenReturn(course);

        // when/then
        mockMvc.perform(get("/api/courses/course-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("course-1"))
                .andExpect(jsonPath("$.title").value("Test Course"))
                .andExpect(jsonPath("$.subject").value("Mathematics"))
                .andExpect(jsonPath("$.price").value(29.99));
    }

    @Test
    void getCourse_notFound_returns400() throws Exception {
        // given
        when(courseService.getCourse("nonexistent"))
                .thenThrow(new RuntimeException("Course not found"));

        // when/then
        mockMvc.perform(get("/api/courses/nonexistent"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Course not found"));
    }

    @Test
    void createCourse_validRequest_returns201() throws Exception {
        // given
        CreateCourseRequest request = buildCreateCourseRequest();
        CourseResponse response = buildCourseResponse("course-new", "New Course");

        when(courseService.createCourse(eq("teacher-1"), any(CreateCourseRequest.class)))
                .thenReturn(response);

        // when/then
        mockMvc.perform(post("/api/courses")
                        .principal(authUser("teacher-1", "TEACHER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("course-new"))
                .andExpect(jsonPath("$.title").value("New Course"));
    }

    @Test
    void updateCourse_returns200() throws Exception {
        // given
        CreateCourseRequest request = buildCreateCourseRequest();
        request.setTitle("Updated Course");
        CourseResponse response = buildCourseResponse("course-1", "Updated Course");

        when(courseService.updateCourse(eq("course-1"), eq("teacher-1"), any(CreateCourseRequest.class)))
                .thenReturn(response);

        // when/then
        mockMvc.perform(put("/api/courses/course-1")
                        .principal(authUser("teacher-1", "TEACHER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("course-1"))
                .andExpect(jsonPath("$.title").value("Updated Course"));
    }

    @Test
    void deleteCourse_returns200() throws Exception {
        // given
        doNothing().when(courseService).deleteCourse("course-1", "teacher-1");

        // when/then
        mockMvc.perform(delete("/api/courses/course-1")
                        .principal(authUser("teacher-1", "TEACHER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Course deleted"));
    }
}
