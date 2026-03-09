package com.videostreaming.live.repository;

import com.videostreaming.live.model.LiveSession;
import com.videostreaming.live.model.LiveSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LiveSessionRepository extends JpaRepository<LiveSession, String> {
    List<LiveSession> findByCourseIdOrderByScheduledAtAsc(String courseId);
    List<LiveSession> findByCourseIdAndModuleIdOrderByScheduledAtAsc(String courseId, String moduleId);
    List<LiveSession> findByTeacherUserIdOrderByScheduledAtDesc(String teacherUserId);
    List<LiveSession> findByCourseIdInAndStatusIn(List<String> courseIds, List<LiveSessionStatus> statuses);
    void deleteByCourseId(String courseId);
}
