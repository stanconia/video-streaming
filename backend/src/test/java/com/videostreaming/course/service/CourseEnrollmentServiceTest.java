package com.videostreaming.course.service;

import com.videostreaming.course.dto.CourseEnrollmentResponse;
import com.videostreaming.course.model.*;
import com.videostreaming.course.repository.*;
import com.videostreaming.notification.service.EmailService;
import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import com.videostreaming.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseEnrollmentServiceTest {

    @Mock
    private CourseEnrollmentRepository courseEnrollmentRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private LessonProgressRepository lessonProgressRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private CourseModuleRepository courseModuleRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private GoogleCalendarLinkService googleCalendarLinkService;

    @InjectMocks
    private CourseEnrollmentService courseEnrollmentService;

    // --- Helper methods ---

    private Course buildCourse(String id, String teacherUserId) {
        return Course.builder()
                .id(id)
                .teacherUserId(teacherUserId)
                .title("Test Course")
                .description("A test course")
                .subject("Testing")
                .price(new BigDecimal("29.99"))
                .currency("USD")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private CourseEnrollment buildEnrollment(String id, String courseId, String studentUserId) {
        return CourseEnrollment.builder()
                .id(id)
                .courseId(courseId)
                .studentUserId(studentUserId)
                .status(EnrollmentStatus.ACTIVE)
                .paidAmount(new BigDecimal("29.99"))
                .enrolledAt(LocalDateTime.now())
                .build();
    }

    private User buildUser(String id, String displayName) {
        return User.builder()
                .id(id)
                .email(id + "@example.com")
                .displayName(displayName)
                .role(UserRole.STUDENT)
                .build();
    }

    // --- enroll tests ---

    @Test
    void enroll_success_savesEnrollmentWithActiveStatusAndSendsNotifications() {
        String courseId = "course-1";
        String studentUserId = "student-1";
        Course course = buildCourse(courseId, "teacher-1");

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(courseEnrollmentRepository.existsByCourseIdAndStudentUserIdAndStatus(
                courseId, studentUserId, EnrollmentStatus.ACTIVE)).thenReturn(false);

        CourseEnrollment savedEnrollment = buildEnrollment("enrollment-1", courseId, studentUserId);
        when(courseEnrollmentRepository.save(any(CourseEnrollment.class))).thenReturn(savedEnrollment);

        // Stub dependencies for toEnrollmentResponse + email sending
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        User student = buildUser(studentUserId, "Test Student");
        when(userRepository.findById(studentUserId)).thenReturn(Optional.of(student));

        User teacher = User.builder()
                .id("teacher-1")
                .displayName("Teacher Name")
                .email("teacher@example.com")
                .role(UserRole.TEACHER)
                .build();
        when(userRepository.findById("teacher-1")).thenReturn(Optional.of(teacher));
        when(googleCalendarLinkService.generateLink(anyString(), anyString(), any(LocalDateTime.class)))
                .thenReturn("https://calendar.google.com/calendar/render?action=TEMPLATE&text=test");

        CourseEnrollmentResponse response = courseEnrollmentService.enroll(
                courseId, studentUserId, "pi_123", new BigDecimal("29.99"));

        assertNotNull(response);
        assertEquals("enrollment-1", response.getId());
        assertEquals(courseId, response.getCourseId());
        assertEquals("ACTIVE", response.getStatus());

        // Verify enrollment was saved with ACTIVE status
        ArgumentCaptor<CourseEnrollment> enrollmentCaptor = ArgumentCaptor.forClass(CourseEnrollment.class);
        verify(courseEnrollmentRepository).save(enrollmentCaptor.capture());
        assertEquals(EnrollmentStatus.ACTIVE, enrollmentCaptor.getValue().getStatus());

        // Verify notifications
        verify(notificationService).sendCourseEnrollmentNotification(studentUserId, "Test Course");

        // Verify email was sent
        verify(emailService).sendTemplatedEmail(eq(student.getEmail()), eq("enrollment_confirmation"), anyMap());
    }

    @Test
    void enroll_alreadyEnrolled_throwsRuntimeException() {
        String courseId = "course-1";
        String studentUserId = "student-1";
        Course course = buildCourse(courseId, "teacher-1");

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(courseEnrollmentRepository.existsByCourseIdAndStudentUserIdAndStatus(
                courseId, studentUserId, EnrollmentStatus.ACTIVE)).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> courseEnrollmentService.enroll(courseId, studentUserId, "pi_123", new BigDecimal("29.99")));
        assertEquals("You are already enrolled in this course", exception.getMessage());

        verify(courseEnrollmentRepository, never()).save(any(CourseEnrollment.class));
    }

    @Test
    void enroll_courseNotFound_throwsIllegalArgumentException() {
        when(courseRepository.findById("nonexistent")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> courseEnrollmentService.enroll("nonexistent", "student-1", "pi_123", new BigDecimal("29.99")));
    }

    // --- cancel tests ---

    @Test
    void cancel_success_setsStatusToCancelled() {
        String enrollmentId = "enrollment-1";
        String studentUserId = "student-1";

        CourseEnrollment enrollment = buildEnrollment(enrollmentId, "course-1", studentUserId);

        when(courseEnrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));

        CourseEnrollment cancelledEnrollment = buildEnrollment(enrollmentId, "course-1", studentUserId);
        cancelledEnrollment.setStatus(EnrollmentStatus.CANCELLED);
        when(courseEnrollmentRepository.save(any(CourseEnrollment.class))).thenReturn(cancelledEnrollment);

        // Stub for toEnrollmentResponse
        Course course = buildCourse("course-1", "teacher-1");
        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));
        User student = buildUser(studentUserId, "Test Student");
        when(userRepository.findById(studentUserId)).thenReturn(Optional.of(student));

        CourseEnrollmentResponse response = courseEnrollmentService.cancel(enrollmentId, studentUserId);

        assertNotNull(response);
        assertEquals("CANCELLED", response.getStatus());

        ArgumentCaptor<CourseEnrollment> captor = ArgumentCaptor.forClass(CourseEnrollment.class);
        verify(courseEnrollmentRepository).save(captor.capture());
        assertEquals(EnrollmentStatus.CANCELLED, captor.getValue().getStatus());
    }

    @Test
    void cancel_wrongUser_throwsRuntimeException() {
        String enrollmentId = "enrollment-1";
        CourseEnrollment enrollment = buildEnrollment(enrollmentId, "course-1", "student-1");

        when(courseEnrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> courseEnrollmentService.cancel(enrollmentId, "other-student"));
        assertEquals("You can only cancel your own enrollments", exception.getMessage());

        verify(courseEnrollmentRepository, never()).save(any(CourseEnrollment.class));
    }

    @Test
    void cancel_enrollmentNotFound_throwsIllegalArgumentException() {
        when(courseEnrollmentRepository.findById("nonexistent")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> courseEnrollmentService.cancel("nonexistent", "student-1"));
    }

    // --- getMyEnrollments tests ---

    @Test
    void getMyEnrollments_returnsList() {
        String studentUserId = "student-1";
        CourseEnrollment enrollment1 = buildEnrollment("e1", "course-1", studentUserId);
        CourseEnrollment enrollment2 = buildEnrollment("e2", "course-2", studentUserId);

        when(courseEnrollmentRepository.findByStudentUserIdOrderByEnrolledAtDesc(studentUserId))
                .thenReturn(List.of(enrollment1, enrollment2));

        // Stub toEnrollmentResponse dependencies
        Course course1 = buildCourse("course-1", "teacher-1");
        Course course2 = buildCourse("course-2", "teacher-1");
        course2.setTitle("Another Course");
        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course1));
        when(courseRepository.findById("course-2")).thenReturn(Optional.of(course2));
        User student = buildUser(studentUserId, "Test Student");
        when(userRepository.findById(studentUserId)).thenReturn(Optional.of(student));

        List<CourseEnrollmentResponse> responses = courseEnrollmentService.getMyEnrollments(studentUserId);

        assertNotNull(responses);
        assertEquals(2, responses.size());
    }

    // --- markLessonComplete tests ---

    @Test
    void markLessonComplete_newProgress_createsAndSavesProgress() {
        String courseId = "course-1";
        String lessonId = "lesson-1";
        String studentUserId = "student-1";

        when(lessonProgressRepository.findByLessonIdAndStudentUserId(lessonId, studentUserId))
                .thenReturn(Optional.empty());
        when(lessonProgressRepository.save(any(LessonProgress.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Stub for recalculateProgress
        when(lessonRepository.countByCourseId(courseId)).thenReturn(5L);
        when(lessonProgressRepository.countByStudentUserIdAndCourseIdAndCompletedTrue(studentUserId, courseId))
                .thenReturn(1L);
        when(courseEnrollmentRepository.findByCourseIdAndStudentUserId(courseId, studentUserId))
                .thenReturn(Optional.empty());

        courseEnrollmentService.markLessonComplete(courseId, lessonId, studentUserId);

        ArgumentCaptor<LessonProgress> captor = ArgumentCaptor.forClass(LessonProgress.class);
        verify(lessonProgressRepository).save(captor.capture());
        LessonProgress savedProgress = captor.getValue();
        assertTrue(savedProgress.isCompleted());
        assertNotNull(savedProgress.getCompletedAt());
        assertEquals(lessonId, savedProgress.getLessonId());
        assertEquals(courseId, savedProgress.getCourseId());
        assertEquals(studentUserId, savedProgress.getStudentUserId());
    }

    @Test
    void markLessonComplete_existingProgress_updatesExistingRecord() {
        String courseId = "course-1";
        String lessonId = "lesson-1";
        String studentUserId = "student-1";

        LessonProgress existingProgress = LessonProgress.builder()
                .id("progress-1")
                .lessonId(lessonId)
                .courseId(courseId)
                .studentUserId(studentUserId)
                .completed(false)
                .build();

        when(lessonProgressRepository.findByLessonIdAndStudentUserId(lessonId, studentUserId))
                .thenReturn(Optional.of(existingProgress));
        when(lessonProgressRepository.save(any(LessonProgress.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Stub for recalculateProgress
        when(lessonRepository.countByCourseId(courseId)).thenReturn(5L);
        when(lessonProgressRepository.countByStudentUserIdAndCourseIdAndCompletedTrue(studentUserId, courseId))
                .thenReturn(1L);
        when(courseEnrollmentRepository.findByCourseIdAndStudentUserId(courseId, studentUserId))
                .thenReturn(Optional.empty());

        courseEnrollmentService.markLessonComplete(courseId, lessonId, studentUserId);

        ArgumentCaptor<LessonProgress> captor = ArgumentCaptor.forClass(LessonProgress.class);
        verify(lessonProgressRepository).save(captor.capture());
        assertTrue(captor.getValue().isCompleted());
        assertEquals("progress-1", captor.getValue().getId());
    }

    // --- markLessonIncomplete tests ---

    @Test
    void markLessonIncomplete_success_setsCompletedFalse() {
        String courseId = "course-1";
        String lessonId = "lesson-1";
        String studentUserId = "student-1";

        LessonProgress progress = LessonProgress.builder()
                .id("progress-1")
                .lessonId(lessonId)
                .courseId(courseId)
                .studentUserId(studentUserId)
                .completed(true)
                .completedAt(LocalDateTime.now())
                .build();

        when(lessonProgressRepository.findByLessonIdAndStudentUserId(lessonId, studentUserId))
                .thenReturn(Optional.of(progress));
        when(lessonProgressRepository.save(any(LessonProgress.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Stub for recalculateProgress
        when(lessonRepository.countByCourseId(courseId)).thenReturn(5L);
        when(lessonProgressRepository.countByStudentUserIdAndCourseIdAndCompletedTrue(studentUserId, courseId))
                .thenReturn(0L);
        when(courseEnrollmentRepository.findByCourseIdAndStudentUserId(courseId, studentUserId))
                .thenReturn(Optional.empty());

        courseEnrollmentService.markLessonIncomplete(courseId, lessonId, studentUserId);

        ArgumentCaptor<LessonProgress> captor = ArgumentCaptor.forClass(LessonProgress.class);
        verify(lessonProgressRepository).save(captor.capture());
        assertFalse(captor.getValue().isCompleted());
        assertNull(captor.getValue().getCompletedAt());
    }

    @Test
    void markLessonIncomplete_progressNotFound_throwsIllegalArgumentException() {
        when(lessonProgressRepository.findByLessonIdAndStudentUserId("lesson-1", "student-1"))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> courseEnrollmentService.markLessonIncomplete("course-1", "lesson-1", "student-1"));
    }

    // --- recalculateProgress tests ---

    @Test
    void recalculateProgress_100percent_completesEnrollmentAndSendsNotification() {
        String courseId = "course-1";
        String studentUserId = "student-1";

        when(lessonRepository.countByCourseId(courseId)).thenReturn(5L);
        when(lessonProgressRepository.countByStudentUserIdAndCourseIdAndCompletedTrue(studentUserId, courseId))
                .thenReturn(5L);

        CourseEnrollment enrollment = buildEnrollment("enrollment-1", courseId, studentUserId);
        enrollment.setStatus(EnrollmentStatus.ACTIVE);
        when(courseEnrollmentRepository.findByCourseIdAndStudentUserId(courseId, studentUserId))
                .thenReturn(Optional.of(enrollment));

        Course course = buildCourse(courseId, "teacher-1");
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));

        courseEnrollmentService.recalculateProgress(courseId, studentUserId);

        ArgumentCaptor<CourseEnrollment> captor = ArgumentCaptor.forClass(CourseEnrollment.class);
        verify(courseEnrollmentRepository).save(captor.capture());
        CourseEnrollment savedEnrollment = captor.getValue();

        assertEquals(100.0, savedEnrollment.getProgressPercentage(), 0.01);
        assertEquals(EnrollmentStatus.COMPLETED, savedEnrollment.getStatus());
        assertNotNull(savedEnrollment.getCompletedAt());

        verify(notificationService).sendCourseCompletedNotification(studentUserId, "Test Course");
    }

    @Test
    void recalculateProgress_partialProgress_updatesPercentageButStaysActive() {
        String courseId = "course-1";
        String studentUserId = "student-1";

        when(lessonRepository.countByCourseId(courseId)).thenReturn(10L);
        when(lessonProgressRepository.countByStudentUserIdAndCourseIdAndCompletedTrue(studentUserId, courseId))
                .thenReturn(3L);

        CourseEnrollment enrollment = buildEnrollment("enrollment-1", courseId, studentUserId);
        enrollment.setStatus(EnrollmentStatus.ACTIVE);
        when(courseEnrollmentRepository.findByCourseIdAndStudentUserId(courseId, studentUserId))
                .thenReturn(Optional.of(enrollment));

        courseEnrollmentService.recalculateProgress(courseId, studentUserId);

        ArgumentCaptor<CourseEnrollment> captor = ArgumentCaptor.forClass(CourseEnrollment.class);
        verify(courseEnrollmentRepository).save(captor.capture());
        CourseEnrollment savedEnrollment = captor.getValue();

        assertEquals(30.0, savedEnrollment.getProgressPercentage(), 0.01);
        assertEquals(EnrollmentStatus.ACTIVE, savedEnrollment.getStatus());
        assertNull(savedEnrollment.getCompletedAt());

        verify(notificationService, never()).sendCourseCompletedNotification(anyString(), anyString());
    }

    @Test
    void recalculateProgress_noEnrollment_doesNotThrow() {
        String courseId = "course-1";
        String studentUserId = "student-1";

        when(lessonRepository.countByCourseId(courseId)).thenReturn(5L);
        when(lessonProgressRepository.countByStudentUserIdAndCourseIdAndCompletedTrue(studentUserId, courseId))
                .thenReturn(3L);
        when(courseEnrollmentRepository.findByCourseIdAndStudentUserId(courseId, studentUserId))
                .thenReturn(Optional.empty());

        // Should not throw, just silently skip
        assertDoesNotThrow(() -> courseEnrollmentService.recalculateProgress(courseId, studentUserId));

        verify(courseEnrollmentRepository, never()).save(any(CourseEnrollment.class));
    }

    @Test
    void recalculateProgress_zeroLessons_setsZeroPercentage() {
        String courseId = "course-1";
        String studentUserId = "student-1";

        when(lessonRepository.countByCourseId(courseId)).thenReturn(0L);
        when(lessonProgressRepository.countByStudentUserIdAndCourseIdAndCompletedTrue(studentUserId, courseId))
                .thenReturn(0L);

        CourseEnrollment enrollment = buildEnrollment("enrollment-1", courseId, studentUserId);
        when(courseEnrollmentRepository.findByCourseIdAndStudentUserId(courseId, studentUserId))
                .thenReturn(Optional.of(enrollment));

        courseEnrollmentService.recalculateProgress(courseId, studentUserId);

        ArgumentCaptor<CourseEnrollment> captor = ArgumentCaptor.forClass(CourseEnrollment.class);
        verify(courseEnrollmentRepository).save(captor.capture());
        assertEquals(0.0, captor.getValue().getProgressPercentage(), 0.01);
    }
}
