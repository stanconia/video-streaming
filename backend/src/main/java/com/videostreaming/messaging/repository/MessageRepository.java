package com.videostreaming.messaging.repository;

import com.videostreaming.messaging.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    Page<Message> findByConversationIdOrderByCreatedAtDesc(String conversationId, Pageable pageable);

    Optional<Message> findTopByConversationIdOrderByCreatedAtDesc(String conversationId);

    long countByConversationIdAndSenderIdNotAndReadFalse(String conversationId, String userId);

    @Query("SELECT COUNT(m) FROM Message m JOIN Conversation c ON m.conversationId = c.id WHERE (c.participantOneId = :userId OR c.participantTwoId = :userId) AND m.senderId != :userId AND m.read = false")
    long countTotalUnreadByUserId(@Param("userId") String userId);

    @Modifying
    @Query("UPDATE Message m SET m.read = true WHERE m.conversationId = :conversationId AND m.senderId != :userId AND m.read = false")
    void markConversationAsRead(@Param("conversationId") String conversationId, @Param("userId") String userId);
}
