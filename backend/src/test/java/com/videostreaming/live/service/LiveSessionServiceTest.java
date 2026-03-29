package com.videostreaming.live.service;

import com.videostreaming.course.model.Course;
import com.videostreaming.course.model.CourseEnrollment;
import com.videostreaming.course.model.EnrollmentStatus;
import com.videostreaming.course.repository.CourseEnrollmentRepository;
import com.videostreaming.course.repository.CourseModuleRepository;
import com.videostreaming.course.repository.CourseRepository;
import com.videostreaming.live.dto.CreateLiveSessionRequest;
import com.videostreaming.live.dto.LiveSessionResponse;
import com.videostreaming.live.model.LiveSession;
import com.videostreaming.live.model.LiveSessionStatus;
import com.videostreaming.live.model.Room;
import com.videostreaming.live.repository.LiveSessionRepository;
import com.videostreaming.live.websocket.SignalingWebSocketHandler;
import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.teacher.repository.TeacherProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LiveSessionServiceTest {

    @Mock private LiveSessionRepository liveSessionRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private CourseModuleRepository courseModuleRepository;
    @Mock private CourseEnrollmentRepository courseEnrollmentRepository;
    @Mock private TeacherProfileRepository teacherProfileRepository;
    @Mock private RoomService roomService;
    @Mock private NotificationService notificationService;
    @Mock private SignalingWebSocketHandler signalingWebSocketHandler;

    @InjectMocks private LiveSessionService service;

    @Test
    void scheduleLiveSession_success() {
        String teacherUserId = "teacher-1";
        String courseId = "course-1";

        Course course = Course.builder()
                .id(courseId)
                .teacherUserId(teacherUserId)
                .title("Test Course")
                .build();

        CreateLiveSessionRequest request = new CreateLiveSessionRequest(
                courseId, null, "Live Q&A", "Live question session",
                "2026-04-01T15:00:00", 60);

        LiveSession savedSession = LiveSession.builder()
                .id("session-1")
                .courseId(courseId)
                .teacherUserId(teacherUserId)
                .title("Live Q&A")
                .description("Live question session")
                .scheduledAt(LocalDateTime.parse("2026-04-01T15:00:00"))
                .durationMinutes(60)
                .status(LiveSessionStatus.SCHEDULED)
                .createdAt(LocalDateTime.now())
                .build();

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(liveSessionRepository.save(any(LiveSession.class))).thenReturn(savedSession);
        when(courseEnrollmentRepository.findByCourseIdAndStatusIn(
                eq(courseId), eq(List.of(EnrollmentStatus.ACTIVE)))).thenReturn(Collections.emptyList());
        when(teacherProfileRepository.findByUserId(teacherUserId)).thenReturn(Optional.empty());

        LiveSessionResponse result = service.scheduleLiveSession(teacherUserId, request);

        assertNotNull(result);
        assertEquals("session-1", result.getId());
        assertEquals("Live Q&A", result.getTitle());
        assertEquals("SCHEDULED", result.getStatus());
        verify(liveSessionRepository).save(any(LiveSession.class));
    }

    @Test
    void startSession_success() {
        String sessionId = "session-1";
        String teacherUserId = "teacher-1";
        LocalDateTime scheduledAt = LocalDateTime.now();

        LiveSession session = LiveSession.builder()
                .id(sessionId)
                .courseId("course-1")
                .teacherUserId(teacherUserId)
                .title("Live Q&A")
                .scheduledAt(scheduledAt)
                .durationMinutes(60)
                .status(LiveSessionStatus.SCHEDULED)
                .createdAt(LocalDateTime.now())
                .build();

        Course course = Course.builder()
                .id("course-1")
                .teacherUserId(teacherUserId)
                .title("Test Course")
                .published(true)
                .build();

        Room room = Room.builder()
                .id("room-1")
                .name("live-Live Q&A")
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        LiveSession startedSession = LiveSession.builder()
                .id(sessionId)
                .courseId("course-1")
                .teacherUserId(teacherUserId)
                .title("Live Q&A")
                .scheduledAt(scheduledAt)
                .durationMinutes(60)
                .status(LiveSessionStatus.LIVE)
                .roomId("room-1")
                .createdAt(LocalDateTime.now())
                .build();

        when(liveSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));
        when(roomService.createRoom("live-Live Q&A")).thenReturn(room);
        when(liveSessionRepository.save(any(LiveSession.class))).thenReturn(startedSession);
        when(courseEnrollmentRepository.findByCourseIdAndStatusIn(
                eq("course-1"), eq(List.of(EnrollmentStatus.ACTIVE)))).thenReturn(Collections.emptyList());
        when(teacherProfileRepository.findByUserId(teacherUserId)).thenReturn(Optional.empty());

        LiveSessionResponse result = service.startSession(sessionId, teacherUserId);

        assertNotNull(result);
        assertEquals("LIVE", result.getStatus());
        assertEquals("room-1", result.getRoomId());
        verify(roomService).createRoom("live-Live Q&A");
    }

    @Test
    void startSession_futureScheduled_stillStarts() {
        // Time window check was removed — teachers can start sessions at any time
        String sessionId = "session-1";
        String teacherUserId = "teacher-1";
        LocalDateTime futureTime = LocalDateTime.now().plusHours(3);

        LiveSession session = LiveSession.builder()
                .id(sessionId)
                .courseId("course-1")
                .teacherUserId(teacherUserId)
                .title("Live Q&A")
                .scheduledAt(futureTime)
                .durationMinutes(60)
                .status(LiveSessionStatus.SCHEDULED)
                .createdAt(LocalDateTime.now())
                .build();

        Course course = Course.builder()
                .id("course-1")
                .teacherUserId(teacherUserId)
                .title("Test Course")
                .published(true)
                .build();

        Room room = Room.builder()
                .id("room-1")
                .name("live-Live Q&A")
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        LiveSession startedSession = LiveSession.builder()
                .id(sessionId)
                .courseId("course-1")
                .teacherUserId(teacherUserId)
                .title("Live Q&A")
                .scheduledAt(futureTime)
                .durationMinutes(60)
                .status(LiveSessionStatus.LIVE)
                .roomId("room-1")
                .createdAt(LocalDateTime.now())
                .build();

        when(liveSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));
        when(roomService.createRoom("live-Live Q&A")).thenReturn(room);
        when(liveSessionRepository.save(any(LiveSession.class))).thenReturn(startedSession);
        when(courseEnrollmentRepository.findByCourseIdAndStatusIn(
                eq("course-1"), eq(List.of(EnrollmentStatus.ACTIVE)))).thenReturn(Collections.emptyList());
        when(teacherProfileRepository.findByUserId(teacherUserId)).thenReturn(Optional.empty());

        LiveSessionResponse result = service.startSession(sessionId, teacherUserId);

        assertNotNull(result);
        assertEquals("LIVE", result.getStatus());
        verify(roomService).createRoom("live-Live Q&A");
    }

    @Test
    void endSession_success() {
        String sessionId = "session-1";
        String teacherUserId = "teacher-1";

        LiveSession session = LiveSession.builder()
                .id(sessionId)
                .courseId("course-1")
                .teacherUserId(teacherUserId)
                .title("Live Q&A")
                .scheduledAt(LocalDateTime.now())
                .durationMinutes(60)
                .status(LiveSessionStatus.LIVE)
                .roomId("room-1")
                .createdAt(LocalDateTime.now())
                .build();

        LiveSession endedSession = LiveSession.builder()
                .id(sessionId)
                .courseId("course-1")
                .teacherUserId(teacherUserId)
                .title("Live Q&A")
                .scheduledAt(LocalDateTime.now())
                .durationMinutes(60)
                .status(LiveSessionStatus.COMPLETED)
                .roomId("room-1")
                .createdAt(LocalDateTime.now())
                .build();

        Course course = Course.builder()
                .id("course-1")
                .teacherUserId(teacherUserId)
                .title("Test Course")
                .published(true)
                .build();

        when(liveSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(liveSessionRepository.save(any(LiveSession.class))).thenReturn(endedSession);
        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));
        when(teacherProfileRepository.findByUserId(teacherUserId)).thenReturn(Optional.empty());

        LiveSessionResponse result = service.endSession(sessionId, teacherUserId);

        assertNotNull(result);
        assertEquals("COMPLETED", result.getStatus());
        verify(liveSessionRepository).save(any(LiveSession.class));
    }

    @Test
    void getSessionsForCourse_returnsList() {
        String courseId = "course-1";

        LiveSession s1 = LiveSession.builder()
                .id("session-1")
                .courseId(courseId)
                .teacherUserId("teacher-1")
                .title("Session 1")
                .scheduledAt(LocalDateTime.now())
                .durationMinutes(60)
                .status(LiveSessionStatus.SCHEDULED)
                .createdAt(LocalDateTime.now())
                .build();

        LiveSession s2 = LiveSession.builder()
                .id("session-2")
                .courseId(courseId)
                .teacherUserId("teacher-1")
                .title("Session 2")
                .scheduledAt(LocalDateTime.now().plusDays(1))
                .durationMinutes(45)
                .status(LiveSessionStatus.SCHEDULED)
                .createdAt(LocalDateTime.now())
                .build();

        Course course = Course.builder()
                .id(courseId)
                .teacherUserId("teacher-1")
                .title("Test Course")
                .published(true)
                .build();

        when(liveSessionRepository.findByCourseIdOrderByScheduledAtAsc(courseId))
                .thenReturn(List.of(s1, s2));
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(teacherProfileRepository.findByUserId("teacher-1")).thenReturn(Optional.empty());

        List<LiveSessionResponse> result = service.getSessionsForCourse(courseId);

        assertEquals(2, result.size());
        assertEquals("Session 1", result.get(0).getTitle());
        assertEquals("Session 2", result.get(1).getTitle());
    }
}
