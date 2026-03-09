package com.videostreaming.discussion.repository;

import com.videostreaming.discussion.model.DiscussionThread;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscussionThreadRepository extends JpaRepository<DiscussionThread, String> {
    List<DiscussionThread> findByCourseIdOrderByLastActivityAtDesc(String courseId);
    long countByCourseId(String courseId);
}
