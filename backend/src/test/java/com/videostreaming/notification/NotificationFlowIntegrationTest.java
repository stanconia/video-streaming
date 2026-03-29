package com.videostreaming.notification;

import com.fasterxml.jackson.databind.JsonNode;
import com.videostreaming.AbstractIntegrationTest;
import com.videostreaming.notification.model.Notification;
import com.videostreaming.notification.model.NotificationType;
import com.videostreaming.notification.repository.NotificationRepository;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class NotificationFlowIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private NotificationRepository notificationRepository;

    // Shared state across ordered tests
    private String userToken;
    private String userId;
    private String firstNotificationId;
    private long initialUnreadCount;

    // -------------------------------------------------------------------------
    // 1. Setup: register a user (triggers a WELCOME notification), then seed 2 more
    // -------------------------------------------------------------------------

    @Test
    @Order(1)
    void setup_registerUserAndSeedNotifications() throws Exception {
        // Register via the real auth endpoint so the WELCOME notification is created
        String body = objectMapper.writeValueAsString(Map.of(
                "email", "notify-user@example.com",
                "password", "Password123!",
                "displayName", "Notify User",
                "role", "STUDENT"
        ));

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        userToken = json.get("token").asText();
        userId = json.get("userId").asText();
        assertThat(userToken).isNotBlank();
        assertThat(userId).isNotBlank();

        // Seed 2 additional unread notifications directly via the repository
        Notification n1 = Notification.builder()
                .userId(userId)
                .type(NotificationType.SYSTEM)
                .title("System Alert")
                .message("Your account settings have been updated.")
                .read(false)
                .build();

        Notification n2 = Notification.builder()
                .userId(userId)
                .type(NotificationType.COURSE_ENROLLED)
                .title("Course Enrolled")
                .message("You have been enrolled in Introduction to Java.")
                .read(false)
                .build();

        notificationRepository.save(n1);
        notificationRepository.save(n2);

        // Capture the initial unread count (WELCOME + 2 seeded = at least 3)
        long count = notificationRepository.countByUserIdAndReadFalse(userId);
        assertThat(count).isGreaterThanOrEqualTo(3);
        initialUnreadCount = count;
    }

    // -------------------------------------------------------------------------
    // 2. GET /api/notifications - returns a paged list with items in "content"
    // -------------------------------------------------------------------------

    @Test
    @Order(2)
    void user_getNotifications_returnsPagedList() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/notifications")
                        .param("page", "0")
                        .param("size", "20")
                        .header("Authorization", authHeader(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(
                        org.hamcrest.Matchers.greaterThanOrEqualTo(3)))
                .andReturn();

        // Capture the ID of the first notification for the mark-as-read test
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        firstNotificationId = json.get("content").get(0).get("id").asText();
        assertThat(firstNotificationId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 3. GET /api/notifications/unread-count - returns the correct count
    // -------------------------------------------------------------------------

    @Test
    @Order(3)
    void user_getUnreadCount_returnsCorrectCount() throws Exception {
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", authHeader(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(
                        org.hamcrest.Matchers.greaterThanOrEqualTo((int) initialUnreadCount)));
    }

    // -------------------------------------------------------------------------
    // 4. PUT /api/notifications/{id}/read - marks a single notification as read
    // -------------------------------------------------------------------------

    @Test
    @Order(4)
    void user_markNotificationAsRead_returns200() throws Exception {
        mockMvc.perform(put("/api/notifications/{id}/read", firstNotificationId)
                        .header("Authorization", authHeader(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty());

        // Verify the notification is now marked as read in the database
        Notification updated = notificationRepository.findById(firstNotificationId).orElseThrow();
        assertThat(updated.isRead()).isTrue();
    }

    // -------------------------------------------------------------------------
    // 5. GET /api/notifications/unread-count - count decrements after marking one read
    // -------------------------------------------------------------------------

    @Test
    @Order(5)
    void user_getUnreadCount_afterMarkingRead_decrements() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", authHeader(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").isNumber())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        long countAfter = json.get("count").asLong();
        assertThat(countAfter).isEqualTo(initialUnreadCount - 1);
    }

    // -------------------------------------------------------------------------
    // 6. PUT /api/notifications/read-all - marks all as read; count becomes 0
    // -------------------------------------------------------------------------

    @Test
    @Order(6)
    void user_markAllAsRead_returns200AndCountIsZero() throws Exception {
        mockMvc.perform(put("/api/notifications/read-all")
                        .header("Authorization", authHeader(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty());

        // Verify via the endpoint that unread count is now 0
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", authHeader(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
    }
}
