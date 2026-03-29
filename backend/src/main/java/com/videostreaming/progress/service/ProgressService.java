package com.videostreaming.progress.service;

import com.videostreaming.course.model.Course;
import com.videostreaming.course.model.CourseEnrollment;
import com.videostreaming.course.model.EnrollmentStatus;
import com.videostreaming.course.model.Lesson;
import com.videostreaming.course.repository.CourseEnrollmentRepository;
import com.videostreaming.course.repository.CourseRepository;
import com.videostreaming.course.repository.LessonRepository;
import com.videostreaming.progress.dto.CourseProgressResponse;
import com.videostreaming.course.model.LessonProgress;
import com.videostreaming.course.repository.LessonProgressRepository;
import com.videostreaming.quiz.repository.QuizAttemptRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProgressService {

    private static final Logger logger = LoggerFactory.getLogger(ProgressService.class);

    private final LessonProgressRepository lessonProgressRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    public ProgressService(LessonProgressRepository lessonProgressRepository,
                           CourseEnrollmentRepository courseEnrollmentRepository,
                           CourseRepository courseRepository,
                           LessonRepository lessonRepository,
                           QuizAttemptRepository quizAttemptRepository) {
        this.lessonProgressRepository = lessonProgressRepository;
        this.courseEnrollmentRepository = courseEnrollmentRepository;
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.quizAttemptRepository = quizAttemptRepository;
    }

    @Transactional
    public CourseProgressResponse.LessonProgressItem markLessonComplete(String userId, String enrollmentId, String lessonId) {
        CourseEnrollment enrollment = courseEnrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found"));

        if (!enrollment.getStudentUserId().equals(userId)) {
            throw new RuntimeException("You can only update your own progress");
        }

        if (enrollment.getStatus() != EnrollmentStatus.ACTIVE) {
            throw new RuntimeException("Enrollment is not active");
        }

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found"));

        if (!lesson.getCourseId().equals(enrollment.getCourseId())) {
            throw new RuntimeException("Lesson does not belong to this course");
        }

        Optional<LessonProgress> existing = lessonProgressRepository.findByLessonIdAndStudentUserId(lessonId, userId);

        LessonProgress progress;
        if (existing.isPresent()) {
            progress = existing.get();
        } else {
            progress = LessonProgress.builder()
                    .lessonId(lessonId)
                    .courseId(enrollment.getCourseId())
                    .studentUserId(userId)
                    .build();
        }

        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());
        lessonProgressRepository.save(progress);

        logger.info("User {} completed lesson '{}' in enrollment '{}'", userId, lessonId, enrollmentId);

        // Recalculate overall progress on the enrollment
        recalculateEnrollmentProgress(enrollment);

        return new CourseProgressResponse.LessonProgressItem(
                lesson.getId(),
                lesson.getTitle(),
                true,
                progress.getCompletedAt()
        );
    }

    public CourseProgressResponse getCourseProgress(String userId, String enrollmentId) {
        CourseEnrollment enrollment = courseEnrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found"));

        if (!enrollment.getStudentUserId().equals(userId)) {
            throw new RuntimeException("You can only view your own progress");
        }

        return buildCourseProgressResponse(enrollment);
    }

    public List<CourseProgressResponse> getAllProgress(String userId) {
        List<CourseEnrollment> enrollments = courseEnrollmentRepository.findByStudentUserIdOrderByEnrolledAtDesc(userId);

        return enrollments.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ACTIVE || e.getStatus() == EnrollmentStatus.COMPLETED)
                .map(this::buildCourseProgressResponse)
                .collect(Collectors.toList());
    }

    // --- Private helpers ---

    private CourseProgressResponse buildCourseProgressResponse(CourseEnrollment enrollment) {
        String courseId = enrollment.getCourseId();
        Course course = courseRepository.findById(courseId).orElse(null);
        String courseTitle = course != null ? course.getTitle() : "Unknown Course";

        List<Lesson> allLessons = lessonRepository.findByCourseId(courseId);
        List<LessonProgress> progressList = lessonProgressRepository.findByStudentUserIdAndCourseId(enrollment.getStudentUserId(), courseId);

        int totalLessons = allLessons.size();
        long completedLessons = lessonProgressRepository.countByStudentUserIdAndCourseIdAndCompletedTrue(enrollment.getStudentUserId(), courseId);
        double progressPercentage = totalLessons > 0 ? (completedLessons * 100.0 / totalLessons) : 0;

        List<CourseProgressResponse.LessonProgressItem> lessonItems = new ArrayList<>();
        LocalDateTime lastAccessedAt = null;

        for (Lesson lesson : allLessons) {
            Optional<LessonProgress> lp = progressList.stream()
                    .filter(p -> p.getLessonId().equals(lesson.getId()))
                    .findFirst();

            boolean completed = lp.map(LessonProgress::isCompleted).orElse(false);
            LocalDateTime completedAt = lp.map(LessonProgress::getCompletedAt).orElse(null);

            lessonItems.add(new CourseProgressResponse.LessonProgressItem(
                    lesson.getId(),
                    lesson.getTitle(),
                    completed,
                    completedAt
            ));

            // Track the most recent activity
            if (completedAt != null && (lastAccessedAt == null || completedAt.isAfter(lastAccessedAt))) {
                lastAccessedAt = completedAt;
            }
        }

        // If no lesson has been completed, fall back to enrollment date
        if (lastAccessedAt == null) {
            lastAccessedAt = enrollment.getEnrolledAt();
        }

        // Get average quiz score for this course and user
        Double averageQuizScore = null;
        try {
            List<com.videostreaming.quiz.model.QuizAttempt> quizAttempts =
                    quizAttemptRepository.findByCourseIdAndStudentUserId(courseId, enrollment.getStudentUserId());
            if (!quizAttempts.isEmpty()) {
                averageQuizScore = quizAttempts.stream()
                        .mapToDouble(com.videostreaming.quiz.model.QuizAttempt::getPercentage)
                        .average()
                        .orElse(0.0);
            }
        } catch (Exception e) {
            logger.warn("Could not load quiz scores for course {}: {}", courseId, e.getMessage());
        }

        return new CourseProgressResponse(
                courseId,
                courseTitle,
                enrollment.getId(),
                totalLessons,
                (int) completedLessons,
                progressPercentage,
                lessonItems,
                averageQuizScore,
                lastAccessedAt
        );
    }

    private void recalculateEnrollmentProgress(CourseEnrollment enrollment) {
        long totalLessons = lessonRepository.countByCourseId(enrollment.getCourseId());
        long completedLessons = lessonProgressRepository.countByStudentUserIdAndCourseIdAndCompletedTrue(enrollment.getStudentUserId(), enrollment.getCourseId());

        double percentage = totalLessons > 0 ? (completedLessons * 100.0 / totalLessons) : 0;
        enrollment.setProgressPercentage(percentage);

        if (percentage >= 100.0 && enrollment.getStatus() == EnrollmentStatus.ACTIVE) {
            enrollment.setStatus(EnrollmentStatus.COMPLETED);
            enrollment.setCompletedAt(LocalDateTime.now());
            logger.info("Enrollment '{}' completed at 100% progress", enrollment.getId());
        }

        courseEnrollmentRepository.save(enrollment);
    }
}
