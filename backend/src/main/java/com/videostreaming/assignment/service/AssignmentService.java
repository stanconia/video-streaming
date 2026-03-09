package com.videostreaming.assignment.service;

import com.videostreaming.shared.service.S3Service;
import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.assignment.model.Assignment;
import com.videostreaming.assignment.model.AssignmentSubmission;
import com.videostreaming.course.model.Course;
import com.videostreaming.user.model.User;
import com.videostreaming.assignment.dto.AssignmentResponse;
import com.videostreaming.assignment.dto.AssignmentSubmissionResponse;
import com.videostreaming.assignment.dto.CreateAssignmentRequest;
import com.videostreaming.assignment.repository.AssignmentRepository;
import com.videostreaming.assignment.repository.AssignmentSubmissionRepository;
import com.videostreaming.course.repository.CourseRepository;
import com.videostreaming.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    private static final Logger logger = LoggerFactory.getLogger(AssignmentService.class);

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;
    private final NotificationService notificationService;

    public AssignmentService(AssignmentRepository assignmentRepository,
                             AssignmentSubmissionRepository submissionRepository,
                             CourseRepository courseRepository,
                             UserRepository userRepository,
                             S3Service s3Service,
                             NotificationService notificationService) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.s3Service = s3Service;
        this.notificationService = notificationService;
    }

    @Transactional
    public AssignmentResponse createAssignment(String courseId, String moduleId,
                                                String teacherUserId, CreateAssignmentRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the course teacher can create assignments");
        }

        LocalDateTime dueDate = null;
        if (request.getDueDate() != null && !request.getDueDate().isEmpty()) {
            dueDate = LocalDateTime.parse(request.getDueDate());
        }

        Assignment assignment = Assignment.builder()
                .moduleId(moduleId)
                .courseId(courseId)
                .teacherUserId(teacherUserId)
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(dueDate)
                .maxScore(request.getMaxScore())
                .orderIndex(request.getOrderIndex())
                .build();

        assignment = assignmentRepository.save(assignment);
        logger.info("Created assignment {} for course {} module {}", assignment.getId(), courseId, moduleId);
        return toAssignmentResponse(assignment);
    }

    @Transactional
    public AssignmentResponse updateAssignment(String assignmentId, String teacherUserId,
                                                CreateAssignmentRequest request) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (!assignment.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the assignment creator can update it");
        }

        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setMaxScore(request.getMaxScore());
        assignment.setOrderIndex(request.getOrderIndex());

        if (request.getDueDate() != null && !request.getDueDate().isEmpty()) {
            assignment.setDueDate(LocalDateTime.parse(request.getDueDate()));
        } else {
            assignment.setDueDate(null);
        }

        assignment = assignmentRepository.save(assignment);
        logger.info("Updated assignment {}", assignmentId);
        return toAssignmentResponse(assignment);
    }

    @Transactional
    public void deleteAssignment(String assignmentId, String teacherUserId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (!assignment.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the assignment creator can delete it");
        }

        assignmentRepository.delete(assignment);
        logger.info("Deleted assignment {}", assignmentId);
    }

    public List<AssignmentResponse> getAssignmentsForModule(String moduleId) {
        return assignmentRepository.findByModuleIdOrderByOrderIndexAsc(moduleId)
                .stream().map(this::toAssignmentResponse).collect(Collectors.toList());
    }

    @Transactional
    public AssignmentSubmissionResponse submitAssignment(String assignmentId, String studentUserId,
                                                          String content, String fileKey, String fileName) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        Optional<AssignmentSubmission> existing = submissionRepository
                .findByAssignmentIdAndStudentUserId(assignmentId, studentUserId);

        AssignmentSubmission submission;
        if (existing.isPresent()) {
            submission = existing.get();
            submission.setContent(content);
            submission.setFileKey(fileKey);
            submission.setFileName(fileName);
            submission.setSubmittedAt(LocalDateTime.now());
        } else {
            submission = AssignmentSubmission.builder()
                    .assignmentId(assignmentId)
                    .courseId(assignment.getCourseId())
                    .studentUserId(studentUserId)
                    .content(content)
                    .fileKey(fileKey)
                    .fileName(fileName)
                    .build();
        }

        submission = submissionRepository.save(submission);
        logger.info("Student {} submitted assignment {}", studentUserId, assignmentId);

        Course course = courseRepository.findById(assignment.getCourseId()).orElse(null);
        if (course != null) {
            String studentName = userRepository.findById(studentUserId)
                    .map(User::getDisplayName).orElse("A student");
            notificationService.sendAssignmentSubmittedNotification(
                    course.getTeacherUserId(), studentName, assignment.getTitle(), course.getId());
        }

        return toSubmissionResponse(submission);
    }

    @Transactional
    public AssignmentSubmissionResponse gradeSubmission(String submissionId, String teacherUserId,
                                                         Integer score, String feedback) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        Assignment assignment = assignmentRepository.findById(submission.getAssignmentId())
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        Course course = courseRepository.findById(assignment.getCourseId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the course teacher can grade submissions");
        }

        submission.setScore(score);
        submission.setFeedback(feedback);
        submission.setGradedAt(LocalDateTime.now());

        submission = submissionRepository.save(submission);
        logger.info("Teacher {} graded submission {} with score {}", teacherUserId, submissionId, score);

        notificationService.sendAssignmentGradedNotification(
                submission.getStudentUserId(), assignment.getTitle(),
                score, assignment.getMaxScore(), course.getId());

        return toSubmissionResponse(submission);
    }

    public List<AssignmentSubmissionResponse> getSubmissions(String assignmentId) {
        return submissionRepository.findByAssignmentIdOrderBySubmittedAtDesc(assignmentId)
                .stream().map(this::toSubmissionResponse).collect(Collectors.toList());
    }

    public AssignmentSubmissionResponse getMySubmission(String assignmentId, String studentUserId) {
        return submissionRepository.findByAssignmentIdAndStudentUserId(assignmentId, studentUserId)
                .map(this::toSubmissionResponse)
                .orElse(null);
    }

    private AssignmentResponse toAssignmentResponse(Assignment a) {
        int submissionCount = (int) submissionRepository.countByAssignmentId(a.getId());
        return new AssignmentResponse(
                a.getId(),
                a.getModuleId(),
                a.getCourseId(),
                a.getTitle(),
                a.getDescription(),
                a.getDueDate(),
                a.getMaxScore(),
                a.getOrderIndex(),
                submissionCount,
                a.getCreatedAt()
        );
    }

    private AssignmentSubmissionResponse toSubmissionResponse(AssignmentSubmission s) {
        String studentDisplayName = userRepository.findById(s.getStudentUserId())
                .map(User::getDisplayName)
                .orElse("Unknown");

        String fileUrl = null;
        if (s.getFileKey() != null && !s.getFileKey().isEmpty()) {
            try {
                fileUrl = s3Service.generatePresignedUrl(s.getFileKey(), 3600);
            } catch (Exception e) {
                logger.warn("Failed to generate presigned URL for submission {}: {}", s.getId(), e.getMessage());
            }
        }

        return new AssignmentSubmissionResponse(
                s.getId(),
                s.getAssignmentId(),
                s.getStudentUserId(),
                studentDisplayName,
                s.getContent(),
                fileUrl,
                s.getFileName(),
                s.getScore(),
                s.getFeedback(),
                s.getGradedAt(),
                s.getSubmittedAt()
        );
    }
}
