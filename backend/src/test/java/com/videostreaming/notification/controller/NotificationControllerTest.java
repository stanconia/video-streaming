package com.videostreaming.notification.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.videostreaming.notification.dto.NotificationResponse;
import com.videostreaming.notification.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController controller;

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

    private NotificationResponse buildNotificationResponse(String id, boolean read) {
        NotificationResponse response = new NotificationResponse();
        response.setId(id);
        response.setType("ENROLLMENT");
        response.setTitle("New enrollment");
        response.setMessage("A student enrolled in your course");
        response.setData("{\"courseId\":\"course-1\"}");
        response.setRead(read);
        response.setCreatedAt(LocalDateTime.of(2025, 3, 1, 10, 0));
        return response;
    }

    @Test
    void getNotifications_returns200() throws Exception {
        // given
        List<NotificationResponse> notifications = List.of(
                buildNotificationResponse("notif-1", false),
                buildNotificationResponse("notif-2", true));

        Page<NotificationResponse> page = new PageImpl<>(notifications, PageRequest.of(0, 20), 2);

        when(notificationService.getNotifications("student-1", 0, 20)).thenReturn(page);

        // when/then
        mockMvc.perform(get("/api/notifications")
                        .principal(authUser("student-1", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("notif-1"))
                .andExpect(jsonPath("$.content[0].type").value("ENROLLMENT"))
                .andExpect(jsonPath("$.content[0].read").value(false))
                .andExpect(jsonPath("$.content[1].id").value("notif-2"))
                .andExpect(jsonPath("$.content[1].read").value(true))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void markAsRead_returns200() throws Exception {
        // given
        doNothing().when(notificationService).markAsRead("notif-1", "student-1");

        // when/then
        mockMvc.perform(put("/api/notifications/notif-1/read")
                        .principal(authUser("student-1", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Marked as read"));
    }

    @Test
    void getUnreadCount_returns200() throws Exception {
        // given
        when(notificationService.getUnreadCount("student-1")).thenReturn(5L);

        // when/then
        mockMvc.perform(get("/api/notifications/unread-count")
                        .principal(authUser("student-1", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(5));
    }
}
