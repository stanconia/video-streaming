package com.videostreaming.assignment.service;

import com.videostreaming.assignment.dto.AssignmentResponse;
import com.videostreaming.assignment.dto.AssignmentSubmissionResponse;
import com.videostreaming.assignment.dto.CreateAssignmentRequest;
import com.videostreaming.assignment.model.Assignment;
import com.videostreaming.assignment.model.AssignmentSubmission;
import com.videostreaming.assignment.repository.AssignmentRepository;
import com.videostreaming.assignment.repository.AssignmentSubmissionRepository;
import com.videostreaming.course.model.Course;
import com.videostreaming.course.repository.CourseRepository;
import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.shared.service.S3Service;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import com.videostreaming.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssignmentServiceTest {

    @Mock private AssignmentRepository assignmentRepository;
    @Mock private AssignmentSubmissionRepository submissionRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private UserRepository userRepository;
    @Mock private S3Service s3Service;
    @Mock private NotificationService notificationService;

    @InjectMocks private AssignmentService service;

    @Test
    void createAssignment_success() {
        String courseId = "course-1";
        String moduleId = "module-1";
        String teacherUserId = "teacher-1";

        Course course = Course.builder()
                .id(courseId)
                .teacherUserId(teacherUserId)
                .title("Test Course")
                .build();

        CreateAssignmentRequest request = new CreateAssignmentRequest(
                "Assignment 1", "Description", "2026-03-01T10:00:00", 100, 0);

        Assignment savedAssignment = Assignment.builder()
                .id("assign-1")
                .moduleId(moduleId)
                .courseId(courseId)
                .teacherUserId(teacherUserId)
                .title("Assignment 1")
                .description("Description")
                .dueDate(LocalDateTime.parse("2026-03-01T10:00:00"))
                .maxScore(100)
                .orderIndex(0)
                .createdAt(LocalDateTime.now())
                .build();

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(assignmentRepository.save(any(Assignment.class))).thenReturn(savedAssignment);
        when(submissionRepository.countByAssignmentId("assign-1")).thenReturn(0L);

        AssignmentResponse result = service.createAssignment(courseId, moduleId, teacherUserId, request);

        assertNotNull(result);
        assertEquals("assign-1", result.getId());
        assertEquals("Assignment 1", result.getTitle());
        assertEquals(100, result.getMaxScore());
        verify(assignmentRepository).save(any(Assignment.class));
    }

    @Test
    void getAssignment_found() {
        String assignmentId = "assign-1";
        Assignment assignment = Assignment.builder()
                .id(assignmentId)
                .moduleId("module-1")
                .courseId("course-1")
                .teacherUserId("teacher-1")
                .title("Assignment 1")
                .description("Description")
                .maxScore(100)
                .orderIndex(0)
                .createdAt(LocalDateTime.now())
                .build();

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));

        Optional<Assignment> result = assignmentRepository.findById(assignmentId);

        assertTrue(result.isPresent());
        assertEquals("Assignment 1", result.get().getTitle());
    }

    @Test
    void submitAssignment_success() {
        String assignmentId = "assign-1";
        String studentUserId = "student-1";
        String content = "My submission content";

        Assignment assignment = Assignment.builder()
                .id(assignmentId)
                .courseId("course-1")
                .teacherUserId("teacher-1")
                .title("Assignment 1")
                .maxScore(100)
                .build();

        Course course = Course.builder()
                .id("course-1")
                .teacherUserId("teacher-1")
                .title("Test Course")
                .build();

        User student = User.builder()
                .id(studentUserId)
                .displayName("John Student")
                .email("john@test.com")
                .role(UserRole.STUDENT)
                .build();

        AssignmentSubmission savedSubmission = AssignmentSubmission.builder()
                .id("sub-1")
                .assignmentId(assignmentId)
                .courseId("course-1")
                .studentUserId(studentUserId)
                .content(content)
                .submittedAt(LocalDateTime.now())
                .build();

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));
        when(submissionRepository.findByAssignmentIdAndStudentUserId(assignmentId, studentUserId))
                .thenReturn(Optional.empty());
        when(submissionRepository.save(any(AssignmentSubmission.class))).thenReturn(savedSubmission);
        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));
        when(userRepository.findById(studentUserId)).thenReturn(Optional.of(student));

        AssignmentSubmissionResponse result = service.submitAssignment(
                assignmentId, studentUserId, content, null, null);

        assertNotNull(result);
        assertEquals("sub-1", result.getId());
        assertEquals(content, result.getContent());
        verify(notificationService).sendAssignmentSubmittedNotification(
                eq("teacher-1"), eq("John Student"), eq("Assignment 1"), eq("course-1"));
    }

    @Test
    void gradeSubmission_success() {
        String submissionId = "sub-1";
        String teacherUserId = "teacher-1";

        AssignmentSubmission submission = AssignmentSubmission.builder()
                .id(submissionId)
                .assignmentId("assign-1")
                .courseId("course-1")
                .studentUserId("student-1")
                .content("Submission content")
                .submittedAt(LocalDateTime.now())
                .build();

        Assignment assignment = Assignment.builder()
                .id("assign-1")
                .courseId("course-1")
                .teacherUserId(teacherUserId)
                .title("Assignment 1")
                .maxScore(100)
                .build();

        Course course = Course.builder()
                .id("course-1")
                .teacherUserId(teacherUserId)
                .title("Test Course")
                .build();

        AssignmentSubmission gradedSubmission = AssignmentSubmission.builder()
                .id(submissionId)
                .assignmentId("assign-1")
                .courseId("course-1")
                .studentUserId("student-1")
                .content("Submission content")
                .score(85)
                .feedback("Good work!")
                .gradedAt(LocalDateTime.now())
                .submittedAt(LocalDateTime.now())
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        when(assignmentRepository.findById("assign-1")).thenReturn(Optional.of(assignment));
        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));
        when(submissionRepository.save(any(AssignmentSubmission.class))).thenReturn(gradedSubmission);
        when(userRepository.findById("student-1")).thenReturn(Optional.empty());

        AssignmentSubmissionResponse result = service.gradeSubmission(submissionId, teacherUserId, 85, "Good work!");

        assertNotNull(result);
        assertEquals(85, result.getScore());
        assertEquals("Good work!", result.getFeedback());
        verify(notificationService).sendAssignmentGradedNotification(
                eq("student-1"), eq("Assignment 1"), eq(85), eq(100), eq("course-1"));
    }

    @Test
    void getAssignmentsForModule_returnsList() {
        String moduleId = "module-1";

        Assignment a1 = Assignment.builder()
                .id("assign-1")
                .moduleId(moduleId)
                .courseId("course-1")
                .teacherUserId("teacher-1")
                .title("Assignment 1")
                .maxScore(100)
                .orderIndex(0)
                .createdAt(LocalDateTime.now())
                .build();

        Assignment a2 = Assignment.builder()
                .id("assign-2")
                .moduleId(moduleId)
                .courseId("course-1")
                .teacherUserId("teacher-1")
                .title("Assignment 2")
                .maxScore(50)
                .orderIndex(1)
                .createdAt(LocalDateTime.now())
                .build();

        when(assignmentRepository.findByModuleIdOrderByOrderIndexAsc(moduleId)).thenReturn(List.of(a1, a2));
        when(submissionRepository.countByAssignmentId("assign-1")).thenReturn(3L);
        when(submissionRepository.countByAssignmentId("assign-2")).thenReturn(1L);

        List<AssignmentResponse> result = service.getAssignmentsForModule(moduleId);

        assertEquals(2, result.size());
        assertEquals("Assignment 1", result.get(0).getTitle());
        assertEquals("Assignment 2", result.get(1).getTitle());
        assertEquals(3, result.get(0).getSubmissionCount());
        assertEquals(1, result.get(1).getSubmissionCount());
    }
}
