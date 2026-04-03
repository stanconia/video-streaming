package com.videostreaming.live.repository;

import com.videostreaming.live.model.Recording;
import com.videostreaming.live.model.RecordingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecordingRepository extends JpaRepository<Recording, String> {
    List<Recording> findByRoomIdOrderByCreatedAtDesc(String roomId);
    Optional<Recording> findByRoomIdAndStatus(String roomId, RecordingStatus status);
    List<Recording> findAllByOrderByCreatedAtDesc();
    List<Recording> findByStatusAndCreatedAtBefore(RecordingStatus status, LocalDateTime before);
    List<Recording> findByStatusIn(List<RecordingStatus> statuses);
}
