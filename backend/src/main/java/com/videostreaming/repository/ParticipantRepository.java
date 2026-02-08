package com.videostreaming.repository;

import com.videostreaming.model.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, String> {
    List<Participant> findByRoomId(String roomId);
    Optional<Participant> findByWebSocketSessionId(String sessionId);
}
