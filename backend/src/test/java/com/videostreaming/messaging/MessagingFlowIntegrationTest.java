package com.videostreaming.messaging;

import com.fasterxml.jackson.databind.JsonNode;
import com.videostreaming.AbstractIntegrationTest;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import org.junit.jupiter.api.*;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class MessagingFlowIntegrationTest extends AbstractIntegrationTest {

    // Shared state across ordered tests
    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;
    private String conversationId;

    // -------------------------------------------------------------------------
    // 1. Setup: create two users directly via the helper (no HTTP round-trip needed)
    // -------------------------------------------------------------------------

    @Test
    @Order(1)
    void setup_createTwoUsers() {
        userA = createUser("msg-usera@example.com", "Alice Sender", UserRole.STUDENT);
        userB = createUser("msg-userb@example.com", "Bob Receiver", UserRole.STUDENT);

        tokenA = getToken(userA);
        tokenB = getToken(userB);

        assertThat(userA.getId()).isNotBlank();
        assertThat(userB.getId()).isNotBlank();
        assertThat(tokenA).isNotBlank();
        assertThat(tokenB).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 2. POST /api/conversations/messages - userA sends a message to userB; returns 201
    // -------------------------------------------------------------------------

    @Test
    @Order(2)
    void userA_sendMessage_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "recipientUserId", userB.getId(),
                "content", "Hello Bob, how are you?"
        ));

        MvcResult result = mockMvc.perform(post("/api/conversations/messages")
                        .header("Authorization", authHeader(tokenA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.senderId").value(userA.getId()))
                .andExpect(jsonPath("$.content").value("Hello Bob, how are you?"))
                .andExpect(jsonPath("$.read").value(false))
                .andReturn();

        // Retrieve the conversationId from userA's conversation list so subsequent tests
        // can reference the specific conversation
        MvcResult convsResult = mockMvc.perform(get("/api/conversations")
                        .header("Authorization", authHeader(tokenA)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode convs = objectMapper.readTree(convsResult.getResponse().getContentAsString());
        assertThat(convs.isArray()).isTrue();
        assertThat(convs.size()).isGreaterThanOrEqualTo(1);

        conversationId = convs.get(0).get("id").asText();
        assertThat(conversationId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 3. GET /api/conversations - userA's list includes the conversation with userB
    // -------------------------------------------------------------------------

    @Test
    @Order(3)
    void userA_getConversations_includesConversation() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/conversations")
                        .header("Authorization", authHeader(tokenA)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.isArray()).isTrue();

        boolean found = false;
        for (JsonNode conv : json) {
            if (conversationId.equals(conv.get("id").asText())) {
                found = true;
                assertThat(conv.get("otherUserId").asText()).isEqualTo(userB.getId());
                assertThat(conv.get("lastMessage").asText()).isEqualTo("Hello Bob, how are you?");
                break;
            }
        }
        assertThat(found).as("userA's conversation list should contain the conversation with userB").isTrue();
    }

    // -------------------------------------------------------------------------
    // 4. GET /api/conversations/{id}/messages - userA retrieves message list
    // -------------------------------------------------------------------------

    @Test
    @Order(4)
    void userA_getMessages_returnsMessageList() throws Exception {
        mockMvc.perform(get("/api/conversations/{id}/messages", conversationId)
                        .param("page", "0")
                        .param("size", "20")
                        .header("Authorization", authHeader(tokenA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.content[0].senderId").value(userA.getId()))
                .andExpect(jsonPath("$.content[0].content").value("Hello Bob, how are you?"));
    }

    // -------------------------------------------------------------------------
    // 5. PUT /api/conversations/{id}/read - userB marks the conversation as read
    // -------------------------------------------------------------------------

    @Test
    @Order(5)
    void userB_markConversationAsRead_returns200() throws Exception {
        mockMvc.perform(put("/api/conversations/{id}/read", conversationId)
                        .header("Authorization", authHeader(tokenB)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    // -------------------------------------------------------------------------
    // 6. GET /api/conversations/unread-count - userB's unread count is now 0
    // -------------------------------------------------------------------------

    @Test
    @Order(6)
    void userB_getUnreadCount_returnsZero() throws Exception {
        mockMvc.perform(get("/api/conversations/unread-count")
                        .header("Authorization", authHeader(tokenB)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
    }
}
