package com.videostreaming.scheduling.repository;

import com.videostreaming.scheduling.model.CalendarBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CalendarBlockRepository extends JpaRepository<CalendarBlock, String> {
    List<CalendarBlock> findByUserIdOrderByStartTimeAsc(String userId);
    List<CalendarBlock> findByUserIdAndStartTimeBetween(String userId, LocalDateTime start, LocalDateTime end);
    boolean existsByUserIdAndStartTimeLessThanAndEndTimeGreaterThan(String userId, LocalDateTime endTime, LocalDateTime startTime);
    List<CalendarBlock> findBySourceTypeAndSourceId(String sourceType, String sourceId);
    void deleteBySourceTypeAndSourceId(String sourceType, String sourceId);
}
