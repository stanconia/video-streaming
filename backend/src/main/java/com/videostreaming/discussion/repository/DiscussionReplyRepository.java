package com.videostreaming.discussion.repository;

import com.videostreaming.discussion.model.DiscussionReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscussionReplyRepository extends JpaRepository<DiscussionReply, String> {
    List<DiscussionReply> findByThreadIdOrderByCreatedAtAsc(String threadId);
    long countByThreadId(String threadId);
}
