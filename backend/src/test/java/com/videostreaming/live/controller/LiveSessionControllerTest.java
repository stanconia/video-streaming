package com.videostreaming.live.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.videostreaming.live.dto.CreateLiveSessionRequest;
import com.videostreaming.live.dto.LiveSessionResponse;
import com.videostreaming.live.service.LiveSessionService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class LiveSessionControllerTest {

    @Mock
    private LiveSessionService liveSessionService;

    @InjectMocks
    private LiveSessionController controller;

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

    private LiveSessionResponse buildSessionResponse(String id, String status) {
        LiveSessionResponse response = new LiveSessionResponse();
        response.setId(id);
        response.setCourseId("course-1");
        response.setCourseTitle("Test Course");
        response.setCoursePublished(true);
        response.setModuleId("module-1");
        response.setModuleTitle("Module One");
        response.setTeacherUserId("teacher-1");
        response.setTeacherDisplayName("Teacher Name");
        response.setTitle("Live Session");
        response.setDescription("A live session");
        response.setScheduledAt(LocalDateTime.of(2025, 4, 1, 14, 0));
        response.setDurationMinutes(60);
        response.setStatus(status);
        response.setRoomId("room-abc");
        response.setCreatedAt(LocalDateTime.of(2025, 3, 15, 10, 0));
        return response;
    }

    @Test
    void createSession_returns200() throws Exception {
        // given
        CreateLiveSessionRequest request = new CreateLiveSessionRequest(
                "course-1", "module-1", "Live Session",
                "A live session", "2025-04-01T14:00:00", 60);
        LiveSessionResponse response = buildSessionResponse("session-1", "SCHEDULED");

        when(liveSessionService.scheduleLiveSession(eq("teacher-1"), any(CreateLiveSessionRequest.class)))
                .thenReturn(response);

        // when/then
        mockMvc.perform(post("/api/live-sessions")
                        .principal(authUser("teacher-1", "TEACHER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("session-1"))
                .andExpect(jsonPath("$.title").value("Live Session"))
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.durationMinutes").value(60))
                .andExpect(jsonPath("$.roomId").value("room-abc"));
    }

    @Test
    void startSession_returns200() throws Exception {
        // given
        LiveSessionResponse response = buildSessionResponse("session-1", "LIVE");

        when(liveSessionService.startSession("session-1", "teacher-1")).thenReturn(response);

        // when/then
        mockMvc.perform(post("/api/live-sessions/session-1/start")
                        .principal(authUser("teacher-1", "TEACHER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("session-1"))
                .andExpect(jsonPath("$.status").value("LIVE"));
    }

    @Test
    void getSessionsForCourse_returns200() throws Exception {
        // given
        List<LiveSessionResponse> sessions = List.of(
                buildSessionResponse("session-1", "SCHEDULED"),
                buildSessionResponse("session-2", "LIVE"));

        when(liveSessionService.getSessionsForCourse("course-1")).thenReturn(sessions);

        // when/then
        mockMvc.perform(get("/api/live-sessions")
                        .param("courseId", "course-1")
                        .principal(authUser("student-1", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("session-1"))
                .andExpect(jsonPath("$[0].status").value("SCHEDULED"))
                .andExpect(jsonPath("$[1].id").value("session-2"))
                .andExpect(jsonPath("$[1].status").value("LIVE"));
    }
}
