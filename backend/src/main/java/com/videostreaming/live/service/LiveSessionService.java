package com.videostreaming.live.service;

import com.videostreaming.live.service.RoomService;
import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.user.model.*;
import com.videostreaming.course.model.*;
import com.videostreaming.live.model.*;
import com.videostreaming.teacher.model.*;
import com.videostreaming.scheduling.model.*;
import com.videostreaming.notification.model.*;
import com.videostreaming.payment.model.*;
import com.videostreaming.review.model.*;
import com.videostreaming.quiz.model.*;
import com.videostreaming.assignment.model.*;
import com.videostreaming.discussion.model.*;
import com.videostreaming.messaging.model.*;
import com.videostreaming.certificate.model.*;
import com.videostreaming.live.dto.CreateLiveSessionRequest;
import com.videostreaming.live.dto.LiveSessionResponse;
import com.videostreaming.user.repository.*;
import com.videostreaming.course.repository.*;
import com.videostreaming.live.repository.*;
import com.videostreaming.teacher.repository.*;
import com.videostreaming.scheduling.repository.*;
import com.videostreaming.notification.repository.*;
import com.videostreaming.payment.repository.*;
import com.videostreaming.review.repository.*;
import com.videostreaming.quiz.repository.*;
import com.videostreaming.assignment.repository.*;
import com.videostreaming.discussion.repository.*;
import com.videostreaming.messaging.repository.*;
import com.videostreaming.certificate.repository.*;
import com.videostreaming.live.websocket.SignalingWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LiveSessionService {

    private static final Logger logger = LoggerFactory.getLogger(LiveSessionService.class);

    private final LiveSessionRepository liveSessionRepository;
    private final CourseRepository courseRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final RoomService roomService;
    private final NotificationService notificationService;
    private final SignalingWebSocketHandler signalingWebSocketHandler;

    public LiveSessionService(LiveSessionRepository liveSessionRepository,
                               CourseRepository courseRepository,
                               CourseModuleRepository courseModuleRepository,
                               CourseEnrollmentRepository courseEnrollmentRepository,
                               TeacherProfileRepository teacherProfileRepository,
                               RoomService roomService,
                               NotificationService notificationService,
                               SignalingWebSocketHandler signalingWebSocketHandler) {
        this.liveSessionRepository = liveSessionRepository;
        this.courseRepository = courseRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.courseEnrollmentRepository = courseEnrollmentRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.roomService = roomService;
        this.notificationService = notificationService;
        this.signalingWebSocketHandler = signalingWebSocketHandler;
    }

    @Transactional
    public LiveSessionResponse scheduleLiveSession(String teacherUserId, CreateLiveSessionRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the course teacher can schedule live sessions");
        }

        if (request.getModuleId() != null && !request.getModuleId().isEmpty()) {
            CourseModule module = courseModuleRepository.findById(request.getModuleId())
                    .orElseThrow(() -> new RuntimeException("Module not found"));
            if (!module.getCourseId().equals(request.getCourseId())) {
                throw new RuntimeException("Module does not belong to this course");
            }
        }

        LocalDateTime scheduledAt = parseDateTime(request.getScheduledAt());

        LiveSession session = LiveSession.builder()
                .courseId(request.getCourseId())
                .moduleId(request.getModuleId())
                .teacherUserId(teacherUserId)
                .title(request.getTitle())
                .description(request.getDescription())
                .scheduledAt(scheduledAt)
                .durationMinutes(request.getDurationMinutes())
                .build();

        session = liveSessionRepository.save(session);
        logger.info("Scheduled live session '{}' for course {} by teacher {}", session.getTitle(), request.getCourseId(), teacherUserId);

        // Notify enrolled students
        String courseTitle = course.getTitle();
        String sessionTitle = session.getTitle();
        List<CourseEnrollment> enrollments = courseEnrollmentRepository.findByCourseIdAndStatusIn(
                request.getCourseId(), List.of(EnrollmentStatus.ACTIVE));
        for (CourseEnrollment enrollment : enrollments) {
            notificationService.sendLiveSessionScheduledNotification(
                    enrollment.getStudentUserId(), sessionTitle, courseTitle);
        }

        return toResponse(session);
    }

    public LiveSessionResponse getSession(String sessionId) {
        LiveSession session = liveSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Live session not found"));
        return toResponse(session);
    }

    public List<LiveSessionResponse> getSessionsForCourse(String courseId) {
        return liveSessionRepository.findByCourseIdOrderByScheduledAtAsc(courseId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<LiveSessionResponse> getSessionsForModule(String courseId, String moduleId) {
        return liveSessionRepository.findByCourseIdAndModuleIdOrderByScheduledAtAsc(courseId, moduleId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public LiveSessionResponse startSession(String sessionId, String teacherUserId) {
        LiveSession session = liveSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Live session not found"));

        if (!session.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the session teacher can start the session");
        }

        if (session.getStatus() != LiveSessionStatus.SCHEDULED) {
            throw new RuntimeException("Session can only be started from SCHEDULED status");
        }

        // Check if course is published
        Course course = courseRepository.findById(session.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));
        if (!course.isPublished()) {
            throw new RuntimeException("Cannot start a live session for an unpublished course. Please publish the course first.");
        }

        // Time window check removed — teachers can start their sessions at any time

        Room room = roomService.createRoom("live-" + session.getTitle());
        session.setRoomId(room.getId());
        session.setStatus(LiveSessionStatus.LIVE);
        session = liveSessionRepository.save(session);
        logger.info("Started live session '{}', room {}", session.getTitle(), room.getId());

        // Notify enrolled students that session is starting
        List<CourseEnrollment> enrollments = courseEnrollmentRepository.findByCourseIdAndStatusIn(
                session.getCourseId(), List.of(EnrollmentStatus.ACTIVE));
        for (CourseEnrollment enrollment : enrollments) {
            notificationService.sendLiveSessionStartingNotification(
                    enrollment.getStudentUserId(), session.getTitle(), room.getId());
        }

        return toResponse(session);
    }

    @Transactional
    public LiveSessionResponse endSession(String sessionId, String teacherUserId) {
        LiveSession session = liveSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Live session not found"));

        if (!session.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the session teacher can end the session");
        }

        if (session.getStatus() != LiveSessionStatus.LIVE) {
            throw new RuntimeException("Session can only be ended from LIVE status");
        }

        String roomId = session.getRoomId();

        session.setStatus(LiveSessionStatus.COMPLETED);
        session = liveSessionRepository.save(session);
        logger.info("Ended live session '{}'", session.getTitle());

        // Broadcast session-ended to all participants in the room
        if (roomId != null) {
            try {
                String notification = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(
                        java.util.Map.of("type", "session-ended", "roomId", roomId, "sessionId", sessionId));
                signalingWebSocketHandler.broadcastToRoomIncludingSender(roomId, notification);
                logger.info("Broadcast session-ended to room {}", roomId);
            } catch (Exception e) {
                logger.error("Error broadcasting session-ended: {}", e.getMessage());
            }
        }

        return toResponse(session);
    }

    @Transactional
    public void cancelSession(String sessionId, String teacherUserId) {
        LiveSession session = liveSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Live session not found"));

        if (!session.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the session teacher can cancel the session");
        }

        if (session.getStatus() == LiveSessionStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed session");
        }

        session.setStatus(LiveSessionStatus.CANCELLED);
        liveSessionRepository.save(session);
        logger.info("Cancelled live session '{}'", session.getTitle());
    }

    public List<LiveSessionResponse> getUpcomingSessionsForStudent(String studentUserId) {
        List<CourseEnrollment> enrollments = courseEnrollmentRepository
                .findByStudentUserIdOrderByEnrolledAtDesc(studentUserId);

        List<String> courseIds = enrollments.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ACTIVE)
                .map(CourseEnrollment::getCourseId)
                .collect(Collectors.toList());

        if (courseIds.isEmpty()) {
            return List.of();
        }

        return liveSessionRepository.findByCourseIdInAndStatusIn(
                        courseIds, List.of(LiveSessionStatus.SCHEDULED, LiveSessionStatus.LIVE))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private LiveSessionResponse toResponse(LiveSession session) {
        Course course = courseRepository.findById(session.getCourseId()).orElse(null);
        String courseTitle = course != null ? course.getTitle() : null;
        boolean coursePublished = course != null && course.isPublished();

        String moduleTitle = null;
        if (session.getModuleId() != null) {
            moduleTitle = courseModuleRepository.findById(session.getModuleId())
                    .map(CourseModule::getTitle).orElse(null);
        }

        String teacherDisplayName = teacherProfileRepository.findByUserId(session.getTeacherUserId())
                .map(TeacherProfile::getDisplayName).orElse(null);

        return new LiveSessionResponse(
                session.getId(),
                session.getCourseId(),
                courseTitle,
                coursePublished,
                session.getModuleId(),
                moduleTitle,
                session.getTeacherUserId(),
                teacherDisplayName,
                session.getTitle(),
                session.getDescription(),
                session.getScheduledAt(),
                session.getDurationMinutes(),
                session.getStatus().name(),
                session.getRoomId(),
                session.getCreatedAt()
        );
    }

    private LocalDateTime parseDateTime(String dateTimeStr) {
        try {
            return LocalDateTime.parse(dateTimeStr);
        } catch (DateTimeParseException e) {
            // Handle ISO 8601 format with Z suffix (e.g. from JavaScript toISOString())
            return Instant.parse(dateTimeStr).atZone(ZoneId.systemDefault()).toLocalDateTime();
        }
    }
}
