package com.videostreaming.messaging.service;

import com.videostreaming.messaging.dto.ConversationResponse;
import com.videostreaming.messaging.dto.MessageResponse;
import com.videostreaming.messaging.model.Conversation;
import com.videostreaming.messaging.model.Message;
import com.videostreaming.messaging.repository.ConversationRepository;
import com.videostreaming.messaging.repository.MessageRepository;
import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import com.videostreaming.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @Mock private ConversationRepository conversationRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks private ConversationService service;

    @Test
    void createConversation_success() {
        String userId1 = "user-1";
        String userId2 = "user-2";

        Conversation savedConversation = Conversation.builder()
                .id("conv-1")
                .participantOneId(userId1)
                .participantTwoId(userId2)
                .lastMessageAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        when(conversationRepository.findByParticipantOneIdAndParticipantTwoId(userId1, userId2))
                .thenReturn(Optional.empty());
        when(conversationRepository.findByParticipantOneIdAndParticipantTwoId(userId2, userId1))
                .thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(savedConversation);

        Conversation result = service.getOrCreateConversation(userId1, userId2);

        assertNotNull(result);
        assertEquals("conv-1", result.getId());
        assertEquals(userId1, result.getParticipantOneId());
        assertEquals(userId2, result.getParticipantTwoId());
        verify(conversationRepository).save(any(Conversation.class));
    }

    @Test
    void sendMessage_success() {
        String senderId = "user-1";
        String recipientUserId = "user-2";
        String content = "Hello there!";

        User recipient = User.builder()
                .id(recipientUserId)
                .displayName("Bob")
                .email("bob@test.com")
                .role(UserRole.STUDENT)
                .build();

        User sender = User.builder()
                .id(senderId)
                .displayName("Alice")
                .email("alice@test.com")
                .role(UserRole.STUDENT)
                .build();

        Conversation conversation = Conversation.builder()
                .id("conv-1")
                .participantOneId(senderId)
                .participantTwoId(recipientUserId)
                .lastMessageAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        Message savedMessage = Message.builder()
                .id("msg-1")
                .conversationId("conv-1")
                .senderId(senderId)
                .content(content)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(recipientUserId)).thenReturn(Optional.of(recipient));
        when(conversationRepository.findByParticipantOneIdAndParticipantTwoId(senderId, recipientUserId))
                .thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
        when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));

        MessageResponse result = service.sendMessage(senderId, recipientUserId, content);

        assertNotNull(result);
        assertEquals("msg-1", result.getId());
        assertEquals(content, result.getContent());
        assertEquals(senderId, result.getSenderId());
        assertFalse(result.isRead());
        verify(notificationService).sendMessageNotification(eq(recipientUserId), eq("Alice"));
    }

    @Test
    void getConversations_returnsList() {
        String userId = "user-1";

        Conversation conv1 = Conversation.builder()
                .id("conv-1")
                .participantOneId(userId)
                .participantTwoId("user-2")
                .lastMessageAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        Conversation conv2 = Conversation.builder()
                .id("conv-2")
                .participantOneId("user-3")
                .participantTwoId(userId)
                .lastMessageAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        User user2 = User.builder()
                .id("user-2")
                .displayName("Bob")
                .email("bob@test.com")
                .role(UserRole.STUDENT)
                .build();

        User user3 = User.builder()
                .id("user-3")
                .displayName("Charlie")
                .email("charlie@test.com")
                .role(UserRole.STUDENT)
                .build();

        when(conversationRepository.findAllByUserId(userId)).thenReturn(List.of(conv1, conv2));
        when(userRepository.findById("user-2")).thenReturn(Optional.of(user2));
        when(userRepository.findById("user-3")).thenReturn(Optional.of(user3));
        when(messageRepository.findTopByConversationIdOrderByCreatedAtDesc("conv-1"))
                .thenReturn(Optional.empty());
        when(messageRepository.findTopByConversationIdOrderByCreatedAtDesc("conv-2"))
                .thenReturn(Optional.empty());
        when(messageRepository.countByConversationIdAndSenderIdNotAndReadFalse("conv-1", userId))
                .thenReturn(0L);
        when(messageRepository.countByConversationIdAndSenderIdNotAndReadFalse("conv-2", userId))
                .thenReturn(0L);

        List<ConversationResponse> result = service.getConversations(userId);

        assertEquals(2, result.size());
        assertEquals("Bob", result.get(0).getOtherDisplayName());
        assertEquals("Charlie", result.get(1).getOtherDisplayName());
    }

    @Test
    void getConversation_notFound_throws() {
        String conversationId = "nonexistent";
        String userId = "user-1";

        when(conversationRepository.findById(conversationId)).thenReturn(Optional.empty());

        // getMessages throws RuntimeException when conversation not found
        assertThrows(RuntimeException.class, () ->
                service.getMessages(conversationId, userId, 0, 20));
    }

    @Test
    void sendMessage_toSelf_throws() {
        String userId = "user-1";

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                service.sendMessage(userId, userId, "Hello myself"));

        assertTrue(exception.getMessage().contains("Cannot send a message to yourself"));
    }
}
