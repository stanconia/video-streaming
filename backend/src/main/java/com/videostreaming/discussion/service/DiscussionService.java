package com.videostreaming.discussion.service;

import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.course.model.Course;
import com.videostreaming.discussion.model.DiscussionReply;
import com.videostreaming.discussion.model.DiscussionThread;
import com.videostreaming.course.model.EnrollmentStatus;
import com.videostreaming.user.model.User;
import com.videostreaming.discussion.dto.DiscussionReplyResponse;
import com.videostreaming.discussion.dto.DiscussionThreadResponse;
import com.videostreaming.course.repository.CourseEnrollmentRepository;
import com.videostreaming.course.repository.CourseRepository;
import com.videostreaming.discussion.repository.DiscussionReplyRepository;
import com.videostreaming.discussion.repository.DiscussionThreadRepository;
import com.videostreaming.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DiscussionService {

    private static final Logger logger = LoggerFactory.getLogger(DiscussionService.class);

    private final DiscussionThreadRepository threadRepository;
    private final DiscussionReplyRepository replyRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public DiscussionService(DiscussionThreadRepository threadRepository,
                             DiscussionReplyRepository replyRepository,
                             CourseRepository courseRepository,
                             CourseEnrollmentRepository enrollmentRepository,
                             UserRepository userRepository,
                             NotificationService notificationService) {
        this.threadRepository = threadRepository;
        this.replyRepository = replyRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public DiscussionThreadResponse createThread(String courseId, String userId,
                                                  String title, String content) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        boolean isTeacher = course.getTeacherUserId().equals(userId);
        boolean isEnrolled = enrollmentRepository.existsByCourseIdAndStudentUserIdAndStatus(courseId, userId, EnrollmentStatus.ACTIVE)
                || enrollmentRepository.existsByCourseIdAndStudentUserIdAndStatus(courseId, userId, EnrollmentStatus.COMPLETED);

        if (!isTeacher && !isEnrolled) {
            throw new RuntimeException("You must be the course teacher or an enrolled student to post");
        }

        DiscussionThread thread = DiscussionThread.builder()
                .courseId(courseId)
                .authorUserId(userId)
                .title(title)
                .content(content)
                .build();

        thread = threadRepository.save(thread);
        logger.info("User {} created discussion thread {} in course {}", userId, thread.getId(), courseId);
        return toThreadResponse(thread);
    }

    public List<DiscussionThreadResponse> getThreads(String courseId) {
        return threadRepository.findByCourseIdOrderByLastActivityAtDesc(courseId)
                .stream().map(this::toThreadResponse).collect(Collectors.toList());
    }

    public DiscussionThreadResponse getThread(String threadId) {
        DiscussionThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new IllegalArgumentException("Thread not found"));
        return toThreadResponse(thread);
    }

    @Transactional
    public DiscussionReplyResponse addReply(String threadId, String userId, String content) {
        DiscussionThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new IllegalArgumentException("Thread not found"));

        DiscussionReply reply = DiscussionReply.builder()
                .threadId(threadId)
                .authorUserId(userId)
                .content(content)
                .build();

        reply = replyRepository.save(reply);

        thread.setReplyCount(thread.getReplyCount() + 1);
        thread.setLastActivityAt(LocalDateTime.now());
        threadRepository.save(thread);

        logger.info("User {} replied to thread {}", userId, threadId);

        if (!userId.equals(thread.getAuthorUserId())) {
            String replierName = userRepository.findById(userId)
                    .map(User::getDisplayName).orElse("Someone");
            notificationService.sendDiscussionReplyNotification(
                    thread.getAuthorUserId(), replierName, thread.getTitle(), thread.getCourseId());
        }

        return toReplyResponse(reply);
    }

    public List<DiscussionReplyResponse> getReplies(String threadId) {
        return replyRepository.findByThreadIdOrderByCreatedAtAsc(threadId)
                .stream().map(this::toReplyResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteThread(String threadId, String userId) {
        DiscussionThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new IllegalArgumentException("Thread not found"));

        if (!thread.getAuthorUserId().equals(userId)) {
            throw new RuntimeException("Only the thread author can delete it");
        }

        threadRepository.delete(thread);
        logger.info("User {} deleted thread {}", userId, threadId);
    }

    @Transactional
    public void deleteReply(String replyId, String userId) {
        DiscussionReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new IllegalArgumentException("Reply not found"));

        if (!reply.getAuthorUserId().equals(userId)) {
            throw new RuntimeException("Only the reply author can delete it");
        }

        DiscussionThread thread = threadRepository.findById(reply.getThreadId()).orElse(null);
        if (thread != null) {
            thread.setReplyCount(Math.max(0, thread.getReplyCount() - 1));
            threadRepository.save(thread);
        }

        replyRepository.delete(reply);
        logger.info("User {} deleted reply {}", userId, replyId);
    }

    private DiscussionThreadResponse toThreadResponse(DiscussionThread t) {
        String authorDisplayName = userRepository.findById(t.getAuthorUserId())
                .map(User::getDisplayName)
                .orElse("Unknown");

        return new DiscussionThreadResponse(
                t.getId(),
                t.getCourseId(),
                t.getAuthorUserId(),
                authorDisplayName,
                t.getTitle(),
                t.getContent(),
                t.getReplyCount(),
                t.getLastActivityAt(),
                t.getCreatedAt()
        );
    }

    private DiscussionReplyResponse toReplyResponse(DiscussionReply r) {
        String authorDisplayName = userRepository.findById(r.getAuthorUserId())
                .map(User::getDisplayName)
                .orElse("Unknown");

        return new DiscussionReplyResponse(
                r.getId(),
                r.getThreadId(),
                r.getAuthorUserId(),
                authorDisplayName,
                r.getContent(),
                r.getCreatedAt()
        );
    }
}
