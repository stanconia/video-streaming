package com.videostreaming.admin.service;

import com.videostreaming.course.dto.CourseEnrollmentResponse;
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
import com.videostreaming.course.dto.*;
import com.videostreaming.live.dto.*;
import com.videostreaming.admin.dto.*;
import com.videostreaming.teacher.dto.*;
import com.videostreaming.scheduling.dto.*;
import com.videostreaming.notification.dto.*;
import com.videostreaming.payment.dto.*;
import com.videostreaming.review.dto.*;
import com.videostreaming.quiz.dto.*;
import com.videostreaming.assignment.dto.*;
import com.videostreaming.discussion.dto.*;
import com.videostreaming.messaging.dto.*;
import com.videostreaming.certificate.dto.*;
import com.videostreaming.user.dto.*;
import com.videostreaming.auth.dto.*;
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
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final ReviewRepository reviewRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final QuizRepository quizRepository;
    private final AssignmentRepository assignmentRepository;
    private final BookingRepository bookingRepository;
    private final ScheduledClassRepository scheduledClassRepository;

    public DashboardService(UserRepository userRepository,
                            CourseRepository courseRepository,
                            CourseEnrollmentRepository courseEnrollmentRepository,
                            ReviewRepository reviewRepository,
                            QuizAttemptRepository quizAttemptRepository,
                            AssignmentSubmissionRepository assignmentSubmissionRepository,
                            QuizRepository quizRepository,
                            AssignmentRepository assignmentRepository,
                            BookingRepository bookingRepository,
                            ScheduledClassRepository scheduledClassRepository) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.courseEnrollmentRepository = courseEnrollmentRepository;
        this.reviewRepository = reviewRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.assignmentSubmissionRepository = assignmentSubmissionRepository;
        this.quizRepository = quizRepository;
        this.assignmentRepository = assignmentRepository;
        this.bookingRepository = bookingRepository;
        this.scheduledClassRepository = scheduledClassRepository;
    }

    public TeacherDashboardResponse getTeacherDashboard(String teacherUserId) {
        TeacherDashboardResponse dashboard = new TeacherDashboardResponse();

        List<Course> courses = courseRepository.findByTeacherUserIdOrderByCreatedAtDesc(teacherUserId);
        long totalStudents = 0;
        for (Course course : courses) {
            long enrolled = courseEnrollmentRepository.countByCourseIdAndStatus(course.getId(), EnrollmentStatus.ACTIVE)
                    + courseEnrollmentRepository.countByCourseIdAndStatus(course.getId(), EnrollmentStatus.COMPLETED);
            totalStudents += enrolled;
        }

        List<Review> reviews = reviewRepository.findByTeacherUserIdOrderByCreatedAtDesc(teacherUserId);
        double avgRating = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);

        // Calculate real earnings
        List<String> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());
        BigDecimal totalEarnings = BigDecimal.ZERO;
        List<TeacherDashboardResponse.MonthlyEarning> monthlyEarnings = new ArrayList<>();

        if (!courseIds.isEmpty()) {
            totalEarnings = courseEnrollmentRepository.sumPaidAmountByCourseIdIn(courseIds);

            // Build monthly earnings for last 6 months
            List<CourseEnrollment> paidEnrollments = courseEnrollmentRepository.findPaidEnrollmentsByCourseIds(courseIds);
            LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6).withDayOfMonth(1)
                    .withHour(0).withMinute(0).withSecond(0);

            Map<String, BigDecimal> monthMap = new LinkedHashMap<>();
            for (int i = 5; i >= 0; i--) {
                LocalDateTime month = LocalDateTime.now().minusMonths(i);
                String key = month.format(DateTimeFormatter.ofPattern("MMM yyyy"));
                monthMap.put(key, BigDecimal.ZERO);
            }

            for (CourseEnrollment e : paidEnrollments) {
                if (e.getEnrolledAt() != null && e.getEnrolledAt().isAfter(sixMonthsAgo)
                        && e.getPaidAmount() != null) {
                    String key = e.getEnrolledAt().format(DateTimeFormatter.ofPattern("MMM yyyy"));
                    monthMap.computeIfPresent(key, (k, v) -> v.add(e.getPaidAmount()));
                }
            }

            monthlyEarnings = monthMap.entrySet().stream()
                    .map(entry -> new TeacherDashboardResponse.MonthlyEarning(entry.getKey(), entry.getValue()))
                    .collect(Collectors.toList());
        }

        // Include scheduled class booking earnings
        List<Booking> classBookings = bookingRepository.findByTeacherUserIdAndStatus(teacherUserId, BookingStatus.CONFIRMED);
        double classBookingEarnings = classBookings.stream()
                .mapToDouble(Booking::getTeacherPayout)
                .sum();
        totalEarnings = totalEarnings.add(BigDecimal.valueOf(classBookingEarnings));

        long classStudents = classBookings.stream()
                .map(Booking::getStudentUserId)
                .distinct()
                .count();
        totalStudents += classStudents;

        long scheduledClassCount = scheduledClassRepository.findByTeacherUserIdOrderByScheduledAtDesc(teacherUserId).size();

        dashboard.setTotalEarnings(totalEarnings);
        dashboard.setTotalStudents(totalStudents);
        dashboard.setTotalClasses(courses.size() + (int) scheduledClassCount);
        dashboard.setUpcomingClasses(0);
        dashboard.setAverageRating(avgRating);
        dashboard.setTotalReviews(reviews.size());
        dashboard.setMonthlyEarnings(monthlyEarnings);
        dashboard.setUpcomingClassList(new ArrayList<>());
        return dashboard;
    }

    public StudentDashboardResponse getStudentDashboard(String studentUserId) {
        StudentDashboardResponse dashboard = new StudentDashboardResponse();

        List<CourseEnrollment> enrollments = courseEnrollmentRepository.findByStudentUserIdOrderByEnrolledAtDesc(studentUserId);
        long active = enrollments.stream().filter(e -> e.getStatus() == EnrollmentStatus.ACTIVE).count();
        long completed = enrollments.stream().filter(e -> e.getStatus() == EnrollmentStatus.COMPLETED).count();

        List<CourseEnrollmentResponse> recent = enrollments.stream()
                .sorted((a, b) -> b.getEnrolledAt().compareTo(a.getEnrolledAt()))
                .limit(5)
                .map(e -> {
                    String courseTitle = courseRepository.findById(e.getCourseId())
                            .map(Course::getTitle).orElse("Unknown Course");
                    String studentName = userRepository.findById(e.getStudentUserId())
                            .map(User::getDisplayName).orElse("Unknown");
                    return new CourseEnrollmentResponse(
                            e.getId(), e.getCourseId(), courseTitle, e.getStudentUserId(), studentName,
                            e.getStatus().name(), e.getPaidAmount(), e.getProgressPercentage(),
                            e.getEnrolledAt(), e.getCompletedAt());
                })
                .collect(Collectors.toList());

        BigDecimal totalSpent = courseEnrollmentRepository.sumPaidAmountByStudentUserId(studentUserId);

        dashboard.setTotalEnrollments(enrollments.size());
        dashboard.setActiveEnrollments(active);
        dashboard.setCompletedCourses(completed);
        dashboard.setTotalSpent(totalSpent);
        dashboard.setRecentEnrollments(recent);
        return dashboard;
    }

    public CourseAnalyticsResponse getCourseAnalytics(String courseId, String teacherUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only view analytics for your own courses");
        }

        long active = courseEnrollmentRepository.countByCourseIdAndStatus(courseId, EnrollmentStatus.ACTIVE);
        long completed = courseEnrollmentRepository.countByCourseIdAndStatus(courseId, EnrollmentStatus.COMPLETED);
        long total = active + completed;
        double completionRate = total > 0 ? (completed * 100.0 / total) : 0;

        List<CourseEnrollment> enrollments = courseEnrollmentRepository
                .findByCourseIdAndStatusIn(courseId, List.of(EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED));
        double avgProgress = enrollments.stream()
                .mapToDouble(CourseEnrollment::getProgressPercentage).average().orElse(0.0);

        Double avgQuizScore = quizAttemptRepository.findAveragePercentageByCourseId(courseId);

        BigDecimal revenue = enrollments.stream()
                .map(e -> e.getPaidAmount() != null ? e.getPaidAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CourseAnalyticsResponse(courseId, course.getTitle(), total, active,
                completed, completionRate, avgProgress, avgQuizScore, revenue);
    }

    public List<StudentPerformanceResponse> getCourseStudents(String courseId, String teacherUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only view students for your own courses");
        }

        List<CourseEnrollment> enrollments = courseEnrollmentRepository
                .findByCourseIdAndStatusIn(courseId, List.of(EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED));

        List<Quiz> quizzes = quizRepository.findByCourseId(courseId);
        List<Assignment> assignments = assignmentRepository.findByCourseId(courseId);

        List<StudentPerformanceResponse> result = new ArrayList<>();
        for (CourseEnrollment enrollment : enrollments) {
            String studentId = enrollment.getStudentUserId();
            String displayName = userRepository.findById(studentId)
                    .map(User::getDisplayName).orElse("Unknown");

            // Quiz attempts
            List<QuizAttempt> attempts = quizAttemptRepository.findByCourseIdAndStudentUserId(courseId, studentId);
            List<StudentPerformanceResponse.QuizAttemptSummary> quizSummaries = attempts.stream()
                    .map(a -> {
                        String quizTitle = quizzes.stream()
                                .filter(q -> q.getId().equals(a.getQuizId()))
                                .map(Quiz::getTitle).findFirst().orElse("Quiz");
                        return new StudentPerformanceResponse.QuizAttemptSummary(
                                a.getQuizId(), quizTitle, a.getPercentage(), a.isPassed());
                    })
                    .collect(Collectors.toList());
            Double avgQuiz = attempts.isEmpty() ? null :
                    attempts.stream().mapToDouble(QuizAttempt::getPercentage).average().orElse(0.0);

            // Assignment grades
            List<AssignmentSubmission> submissions = assignmentSubmissionRepository
                    .findByCourseIdAndStudentUserId(courseId, studentId);
            List<StudentPerformanceResponse.AssignmentGradeSummary> assignmentSummaries = submissions.stream()
                    .map(s -> {
                        int maxScore = assignments.stream()
                                .filter(a -> a.getId().equals(s.getAssignmentId()))
                                .map(Assignment::getMaxScore).findFirst().orElse(100);
                        String assignmentTitle = assignments.stream()
                                .filter(a -> a.getId().equals(s.getAssignmentId()))
                                .map(Assignment::getTitle).findFirst().orElse("Assignment");
                        return new StudentPerformanceResponse.AssignmentGradeSummary(
                                s.getAssignmentId(), assignmentTitle, s.getScore(), maxScore);
                    })
                    .collect(Collectors.toList());
            Double avgAssignment = submissions.stream().noneMatch(s -> s.getScore() != null) ? null :
                    submissions.stream()
                            .filter(s -> s.getScore() != null)
                            .mapToDouble(s -> {
                                int maxScore = assignments.stream()
                                        .filter(a -> a.getId().equals(s.getAssignmentId()))
                                        .map(Assignment::getMaxScore).findFirst().orElse(100);
                                return maxScore > 0 ? (s.getScore() * 100.0 / maxScore) : 0;
                            }).average().orElse(0.0);

            StudentPerformanceResponse spr = new StudentPerformanceResponse();
            spr.setStudentUserId(studentId);
            spr.setStudentDisplayName(displayName);
            spr.setProgressPercentage(enrollment.getProgressPercentage());
            spr.setEnrollmentStatus(enrollment.getStatus().name());
            spr.setPaidAmount(enrollment.getPaidAmount());
            spr.setAverageQuizScore(avgQuiz);
            spr.setAverageAssignmentScore(avgAssignment);
            spr.setQuizAttempts(quizSummaries);
            spr.setAssignmentGrades(assignmentSummaries);
            result.add(spr);
        }
        return result;
    }
}
