package com.videostreaming.messaging.repository;

import com.videostreaming.messaging.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {

    Optional<Conversation> findByParticipantOneIdAndParticipantTwoId(String p1, String p2);

    @Query("SELECT c FROM Conversation c WHERE c.participantOneId = :userId OR c.participantTwoId = :userId ORDER BY c.lastMessageAt DESC")
    List<Conversation> findAllByUserId(@Param("userId") String userId);
}
