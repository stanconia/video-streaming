package com.videostreaming.messaging.service;

import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.messaging.model.Conversation;
import com.videostreaming.messaging.model.Message;
import com.videostreaming.user.model.User;
import com.videostreaming.messaging.dto.ConversationResponse;
import com.videostreaming.messaging.dto.MessageResponse;
import com.videostreaming.messaging.repository.ConversationRepository;
import com.videostreaming.messaging.repository.MessageRepository;
import com.videostreaming.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ConversationService {

    private static final Logger logger = LoggerFactory.getLogger(ConversationService.class);

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ConversationService(ConversationRepository conversationRepository,
                                MessageRepository messageRepository,
                                UserRepository userRepository,
                                NotificationService notificationService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public Conversation getOrCreateConversation(String userId1, String userId2) {
        Optional<Conversation> conversation = conversationRepository
                .findByParticipantOneIdAndParticipantTwoId(userId1, userId2);

        if (conversation.isPresent()) {
            return conversation.get();
        }

        conversation = conversationRepository
                .findByParticipantOneIdAndParticipantTwoId(userId2, userId1);

        if (conversation.isPresent()) {
            return conversation.get();
        }

        Conversation newConversation = Conversation.builder()
                .participantOneId(userId1)
                .participantTwoId(userId2)
                .build();

        newConversation = conversationRepository.save(newConversation);
        logger.info("Created new conversation between {} and {}", userId1, userId2);
        return newConversation;
    }

    @Transactional
    public MessageResponse sendMessage(String senderId, String recipientUserId, String content) {
        if (content == null || content.isBlank()) {
            throw new RuntimeException("Message content cannot be empty");
        }

        if (senderId.equals(recipientUserId)) {
            throw new RuntimeException("Cannot send a message to yourself");
        }

        userRepository.findById(recipientUserId)
                .orElseThrow(() -> new RuntimeException("Recipient user not found"));

        Conversation conversation = getOrCreateConversation(senderId, recipientUserId);

        Message message = Message.builder()
                .conversationId(conversation.getId())
                .senderId(senderId)
                .content(content)
                .build();

        message = messageRepository.save(message);

        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        logger.info("Message sent from {} to {} in conversation {}", senderId, recipientUserId, conversation.getId());

        String senderDisplayName = userRepository.findById(senderId)
                .map(User::getDisplayName).orElse("Someone");
        notificationService.sendMessageNotification(recipientUserId, senderDisplayName);

        return toMessageResponse(message);
    }

    public List<ConversationResponse> getConversations(String userId) {
        List<Conversation> conversations = conversationRepository.findAllByUserId(userId);

        return conversations.stream().map(conv -> {
            String otherUserId = conv.getParticipantOneId().equals(userId)
                    ? conv.getParticipantTwoId()
                    : conv.getParticipantOneId();

            String otherDisplayName = userRepository.findById(otherUserId)
                    .map(User::getDisplayName)
                    .orElse("Unknown");

            String lastMessage = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(conv.getId())
                    .map(Message::getContent)
                    .orElse(null);

            long unreadCount = messageRepository.countByConversationIdAndSenderIdNotAndReadFalse(
                    conv.getId(), userId);

            return new ConversationResponse(
                    conv.getId(),
                    otherUserId,
                    otherDisplayName,
                    lastMessage,
                    conv.getLastMessageAt(),
                    unreadCount
            );
        }).collect(Collectors.toList());
    }

    public Page<MessageResponse> getMessages(String conversationId, String userId, int page, int size) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.getParticipantOneId().equals(userId)
                && !conversation.getParticipantTwoId().equals(userId)) {
            throw new RuntimeException("You are not a participant of this conversation");
        }

        Page<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(
                conversationId, PageRequest.of(page, size));

        return messages.map(this::toMessageResponse);
    }

    @Transactional
    public void markAsRead(String conversationId, String userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.getParticipantOneId().equals(userId)
                && !conversation.getParticipantTwoId().equals(userId)) {
            throw new RuntimeException("You are not a participant of this conversation");
        }

        messageRepository.markConversationAsRead(conversationId, userId);
        logger.info("Marked messages as read in conversation {} for user {}", conversationId, userId);
    }

    public long getUnreadCount(String userId) {
        return messageRepository.countTotalUnreadByUserId(userId);
    }

    private MessageResponse toMessageResponse(Message message) {
        String senderDisplayName = userRepository.findById(message.getSenderId())
                .map(User::getDisplayName)
                .orElse("Unknown");

        return new MessageResponse(
                message.getId(),
                message.getSenderId(),
                senderDisplayName,
                message.getContent(),
                message.isRead(),
                message.getCreatedAt()
        );
    }
}
