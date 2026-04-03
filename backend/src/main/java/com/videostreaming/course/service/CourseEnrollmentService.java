package com.videostreaming.course.service;

import com.videostreaming.auth.model.ParentalConsent;
import com.videostreaming.auth.service.AuthService;
import com.videostreaming.notification.service.EmailService;
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
import com.videostreaming.course.dto.CourseEnrollmentResponse;
import com.videostreaming.course.dto.CourseProgressResponse;
import com.videostreaming.course.dto.ModuleProgressResponse;
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
import com.videostreaming.scheduling.service.CalendarBlockService;
import com.videostreaming.payment.service.StripePaymentGateway;
import com.stripe.model.PaymentIntent;
import com.stripe.exception.StripeException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CourseEnrollmentService {

    private static final Logger logger = LoggerFactory.getLogger(CourseEnrollmentService.class);

    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final CourseModuleRepository courseModuleRepository;
    private final EmailService emailService;
    private final GoogleCalendarLinkService googleCalendarLinkService;
    private final CalendarBlockService calendarBlockService;
    private final LiveSessionRepository liveSessionRepository;
    private final StripePaymentGateway stripePaymentGateway;
    private final AuthService authService;

    public CourseEnrollmentService(CourseEnrollmentRepository courseEnrollmentRepository,
                                   CourseRepository courseRepository,
                                   LessonRepository lessonRepository,
                                   LessonProgressRepository lessonProgressRepository,
                                   UserRepository userRepository,
                                   NotificationService notificationService,
                                   CourseModuleRepository courseModuleRepository,
                                   EmailService emailService,
                                   GoogleCalendarLinkService googleCalendarLinkService,
                                   CalendarBlockService calendarBlockService,
                                   LiveSessionRepository liveSessionRepository,
                                   StripePaymentGateway stripePaymentGateway,
                                   AuthService authService) {
        this.courseEnrollmentRepository = courseEnrollmentRepository;
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.courseModuleRepository = courseModuleRepository;
        this.emailService = emailService;
        this.googleCalendarLinkService = googleCalendarLinkService;
        this.calendarBlockService = calendarBlockService;
        this.liveSessionRepository = liveSessionRepository;
        this.stripePaymentGateway = stripePaymentGateway;
        this.authService = authService;
    }

    @Transactional
    public CourseEnrollmentResponse enroll(String courseId, String studentUserId,
                                           String paymentIntentId, BigDecimal paidAmount) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        User student = userRepository.findById(studentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        // Age eligibility check
        if (student.getDateOfBirth() != null) {
            int studentAge = Period.between(student.getDateOfBirth(), LocalDate.now()).getYears();

            if (course.getMinAge() != null && studentAge < course.getMinAge()) {
                throw new RuntimeException("You must be at least " + course.getMinAge() + " years old to enroll in this course");
            }
            if (course.getMaxAge() != null && studentAge > course.getMaxAge()) {
                throw new RuntimeException("This course is for students " + course.getMaxAge() + " years old and under");
            }

            // COPPA: under-13 needs parental consent to be granted first
            if (studentAge < 13 && !student.isParentalConsentGranted()) {
                throw new RuntimeException("Parental consent is required before enrolling. Please ask your parent/guardian to approve your account first.");
            }
        }

        // Check for existing active enrollment first (before payment verification)
        boolean isPaidCourse = course.getPrice() != null && course.getPrice().compareTo(BigDecimal.ZERO) > 0;
        if (courseEnrollmentRepository.existsByCourseIdAndStudentUserIdAndStatus(courseId, studentUserId, EnrollmentStatus.ACTIVE)
            || courseEnrollmentRepository.existsByCourseIdAndStudentUserIdAndStatus(courseId, studentUserId, EnrollmentStatus.PENDING_PARENT_APPROVAL)) {
            throw new RuntimeException("You are already enrolled in this course");
        }

        // Payment enforcement for paid courses
        if (isPaidCourse) {
            if (paymentIntentId == null || paymentIntentId.isBlank()) {
                throw new RuntimeException("Payment is required for this course");
            }
            try {
                PaymentIntent pi = stripePaymentGateway.retrievePaymentIntent(paymentIntentId);
                if (!"succeeded".equals(pi.getStatus())) {
                    throw new RuntimeException("Payment has not been completed");
                }
                String metaCourseId = pi.getMetadata().get("courseId");
                if (!courseId.equals(metaCourseId)) {
                    throw new RuntimeException("Payment does not match this course");
                }
                paidAmount = BigDecimal.valueOf(pi.getAmount()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            } catch (StripeException e) {
                logger.error("Failed to verify PaymentIntent {}: {}", paymentIntentId, e.getMessage());
                throw new RuntimeException("Payment verification failed");
            }
        }

        // Check for existing cancelled enrollment (re-enrollment)
        Optional<CourseEnrollment> existing = courseEnrollmentRepository.findByCourseIdAndStudentUserId(courseId, studentUserId);
        if (existing.isPresent()) {
            CourseEnrollment prev = existing.get();
            // Reactivate cancelled enrollment
            prev.setStatus(EnrollmentStatus.ACTIVE);
            prev.setEnrolledAt(java.time.LocalDateTime.now());
            prev.setProgressPercentage(0);
            prev.setCompletedAt(null);
            if (paymentIntentId != null) prev.setPaymentIntentId(paymentIntentId);
            if (paidAmount != null) prev.setPaidAmount(paidAmount);
            // Calculate escrow for paid re-enrollment
            if (isPaidCourse && paidAmount != null) {
                BigDecimal fee = paidAmount.multiply(new BigDecimal("0.15"))
                        .setScale(2, java.math.RoundingMode.HALF_UP);
                BigDecimal payout = paidAmount.subtract(fee);
                prev.setPlatformFee(fee);
                prev.setTeacherPayout(payout);
                prev.setPayoutStatus("HELD");
            }
            prev = courseEnrollmentRepository.save(prev);
            logger.info("Student {} re-enrolled in course '{}'", studentUserId, course.getTitle());

            // Send notifications and email for re-enrollment
            notificationService.sendCourseEnrollmentNotification(studentUserId, course.getTitle());

            try {
                if (course.getTeacherUserId() != null) {
                    calendarBlockService.blockSlotsForEnrollment(
                            courseId, studentUserId, course.getTeacherUserId(), prev.getId());
                }
            } catch (Exception e) {
                logger.warn("Failed to block calendar slots on re-enroll: {}", e.getMessage());
            }

            try {
                User studentUser = userRepository.findById(studentUserId).orElse(null);
                String teacherName = "EduLive Teacher";
                if (course.getTeacherUserId() != null) {
                    teacherName = userRepository.findById(course.getTeacherUserId())
                            .map(User::getDisplayName).orElse("EduLive Teacher");
                }

                List<CourseEnrollmentResponse.SessionCalendarLink> sessionLinks = buildSessionCalendarLinks(courseId, course.getTitle());
                String calendarLinksSection = buildCalendarLinksSection(sessionLinks);

                if (studentUser != null) {
                    Map<String, String> emailVars = new HashMap<>();
                    emailVars.put("studentName", studentUser.getDisplayName());
                    emailVars.put("courseName", course.getTitle());
                    emailVars.put("teacherName", teacherName);
                    if (!calendarLinksSection.isEmpty()) {
                        emailVars.put("calendarLinks", calendarLinksSection);
                    }
                    emailService.sendTemplatedEmail(studentUser.getEmail(), "enrollment_confirmation", emailVars);
                }

                if (course.getTeacherUserId() != null) {
                    String studentDisplayName = studentUser != null ? studentUser.getDisplayName() : "A student";
                    notificationService.sendNewStudentEnrolledNotification(
                            course.getTeacherUserId(), studentDisplayName, course.getTitle(), courseId);
                }

                CourseEnrollmentResponse response = toEnrollmentResponse(prev);
                if (!sessionLinks.isEmpty()) {
                    response.setCalendarLinks(sessionLinks);
                }
                return response;
            } catch (Exception e) {
                logger.warn("Failed to send re-enrollment email: {}", e.getMessage());
            }

            return toEnrollmentResponse(prev);
        }

        // Determine if under-13 needs parental approval per-enrollment
        boolean needsParentApproval = false;
        if (student.getDateOfBirth() != null) {
            int studentAge = Period.between(student.getDateOfBirth(), LocalDate.now()).getYears();
            needsParentApproval = studentAge < 13;
        }

        EnrollmentStatus initialStatus = needsParentApproval
                ? EnrollmentStatus.PENDING_PARENT_APPROVAL : EnrollmentStatus.ACTIVE;

        CourseEnrollment enrollment = CourseEnrollment.builder()
                .courseId(courseId)
                .studentUserId(studentUserId)
                .paymentIntentId(paymentIntentId)
                .paidAmount(paidAmount)
                .status(initialStatus)
                .build();

        enrollment = courseEnrollmentRepository.save(enrollment);
        logger.info("Student {} enrolled in course '{}' with status {}", studentUserId, course.getTitle(), initialStatus);

        // Send parental approval email for under-13
        if (needsParentApproval && student.getParentEmail() != null) {
            authService.sendParentalConsentEmail(student, ParentalConsent.ConsentType.ENROLLMENT,
                    courseId, enrollment.getId());
            logger.info("Parental approval request sent for enrollment {} in course '{}'",
                    enrollment.getId(), course.getTitle());
            return toEnrollmentResponse(enrollment);
        }

        // Calculate escrow for paid courses
        if (isPaidCourse && paidAmount != null) {
            BigDecimal fee = paidAmount.multiply(new BigDecimal("0.15"))
                    .setScale(2, java.math.RoundingMode.HALF_UP);
            BigDecimal payout = paidAmount.subtract(fee);
            enrollment.setPlatformFee(fee);
            enrollment.setTeacherPayout(payout);
            enrollment.setPayoutStatus("HELD");
            enrollment = courseEnrollmentRepository.save(enrollment);
            logger.info("Course payment held: total={}, fee={}, payout={}", paidAmount, fee, payout);
        }

        notificationService.sendCourseEnrollmentNotification(studentUserId, course.getTitle());

        // Block calendar slots for both student and teacher
        try {
            if (course.getTeacherUserId() != null) {
                calendarBlockService.blockSlotsForEnrollment(
                        courseId, studentUserId, course.getTeacherUserId(), enrollment.getId());
            }
        } catch (Exception e) {
            logger.warn("Failed to block calendar slots: {}", e.getMessage());
        }

        // Send enrollment email and generate calendar link
        try {
            String teacherName = "EduLive Teacher";
            if (course.getTeacherUserId() != null) {
                teacherName = userRepository.findById(course.getTeacherUserId())
                        .map(User::getDisplayName).orElse("EduLive Teacher");
            }

            List<CourseEnrollmentResponse.SessionCalendarLink> sessionLinks = buildSessionCalendarLinks(courseId, course.getTitle());
            String calendarLinksSection = buildCalendarLinksSection(sessionLinks);

            Map<String, String> emailVars = new HashMap<>();
            emailVars.put("studentName", student.getDisplayName());
            emailVars.put("courseName", course.getTitle());
            emailVars.put("teacherName", teacherName);
            if (!calendarLinksSection.isEmpty()) {
                emailVars.put("calendarLinks", calendarLinksSection);
            }
            emailService.sendTemplatedEmail(student.getEmail(), "enrollment_confirmation", emailVars);

            // Notify teacher about new enrollment
            if (course.getTeacherUserId() != null) {
                String studentDisplayName = student.getDisplayName();
                notificationService.sendNewStudentEnrolledNotification(
                        course.getTeacherUserId(), studentDisplayName, course.getTitle(), courseId);
            }

            CourseEnrollmentResponse response = toEnrollmentResponse(enrollment);
            if (!sessionLinks.isEmpty()) {
                response.setCalendarLinks(sessionLinks);
            }
            return response;
        } catch (Exception e) {
            logger.warn("Failed to send enrollment email: {}", e.getMessage());
        }

        return toEnrollmentResponse(enrollment);
    }

    @Transactional
    public CourseEnrollmentResponse cancel(String enrollmentId, String studentUserId) {
        CourseEnrollment enrollment = courseEnrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found"));

        if (!enrollment.getStudentUserId().equals(studentUserId)) {
            throw new RuntimeException("You can only cancel your own enrollments");
        }

        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        enrollment = courseEnrollmentRepository.save(enrollment);
        logger.info("Student {} cancelled enrollment '{}'", studentUserId, enrollmentId);

        // Remove calendar blocks
        try {
            calendarBlockService.removeBlocksForEnrollment(enrollmentId);
        } catch (Exception e) {
            logger.warn("Failed to remove calendar blocks: {}", e.getMessage());
        }

        return toEnrollmentResponse(enrollment);
    }

    public List<CourseEnrollmentResponse> getMyEnrollments(String studentUserId) {
        return courseEnrollmentRepository.findByStudentUserIdOrderByEnrolledAtDesc(studentUserId)
                .stream()
                .map(this::toEnrollmentResponse)
                .collect(Collectors.toList());
    }

    public List<CourseEnrollmentResponse> getCourseEnrollments(String courseId) {
        return courseEnrollmentRepository.findByCourseIdOrderByEnrolledAtDesc(courseId)
                .stream()
                .map(this::toEnrollmentResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markLessonComplete(String courseId, String lessonId, String studentUserId) {
        Optional<LessonProgress> existing = lessonProgressRepository.findByLessonIdAndStudentUserId(
                lessonId, studentUserId);

        LessonProgress progress;
        if (existing.isPresent()) {
            progress = existing.get();
        } else {
            progress = LessonProgress.builder()
                    .lessonId(lessonId)
                    .courseId(courseId)
                    .studentUserId(studentUserId)
                    .build();
        }

        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());
        lessonProgressRepository.save(progress);
        logger.info("Student {} completed lesson '{}' in course '{}'", studentUserId, lessonId, courseId);

        recalculateProgress(courseId, studentUserId);
    }

    @Transactional
    public void markLessonIncomplete(String courseId, String lessonId, String studentUserId) {
        LessonProgress progress = lessonProgressRepository.findByLessonIdAndStudentUserId(
                        lessonId, studentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Lesson progress not found"));

        progress.setCompleted(false);
        progress.setCompletedAt(null);
        lessonProgressRepository.save(progress);
        logger.info("Student {} marked lesson '{}' incomplete in course '{}'", studentUserId, lessonId, courseId);

        recalculateProgress(courseId, studentUserId);
    }

    public CourseProgressResponse getCourseProgress(String courseId, String studentUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        List<LessonProgress> allProgress = lessonProgressRepository.findByStudentUserIdAndCourseId(
                studentUserId, courseId);

        List<CourseModule> modules = courseModuleRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        List<ModuleProgressResponse> moduleProgressList = new ArrayList<>();

        int totalLessons = 0;
        int totalCompleted = 0;

        for (CourseModule module : modules) {
            List<Lesson> lessons = lessonRepository.findByModuleIdOrderByOrderIndexAsc(module.getId());
            List<ModuleProgressResponse.LessonProgressItem> lessonItems = new ArrayList<>();

            int moduleCompleted = 0;
            for (Lesson lesson : lessons) {
                Optional<LessonProgress> lp = allProgress.stream()
                        .filter(p -> p.getLessonId().equals(lesson.getId()))
                        .findFirst();

                boolean completed = lp.map(LessonProgress::isCompleted).orElse(false);
                LocalDateTime completedAt = lp.map(LessonProgress::getCompletedAt).orElse(null);

                if (completed) {
                    moduleCompleted++;
                }

                lessonItems.add(new ModuleProgressResponse.LessonProgressItem(
                        lesson.getId(),
                        lesson.getTitle(),
                        completed,
                        completedAt
                ));
            }

            int moduleTotalLessons = lessons.size();
            double modulePercentage = moduleTotalLessons > 0
                    ? (moduleCompleted * 100.0 / moduleTotalLessons) : 0;

            moduleProgressList.add(new ModuleProgressResponse(
                    module.getId(),
                    module.getTitle(),
                    moduleTotalLessons,
                    moduleCompleted,
                    modulePercentage,
                    lessonItems
            ));

            totalLessons += moduleTotalLessons;
            totalCompleted += moduleCompleted;
        }

        double overallPercentage = totalLessons > 0 ? (totalCompleted * 100.0 / totalLessons) : 0;

        return new CourseProgressResponse(
                courseId,
                course.getTitle(),
                overallPercentage,
                totalLessons,
                totalCompleted,
                moduleProgressList
        );
    }

    @Transactional
    public void recalculateProgress(String courseId, String studentUserId) {
        long totalLessons = lessonRepository.countByCourseId(courseId);
        long completedLessons = lessonProgressRepository.countByStudentUserIdAndCourseIdAndCompletedTrue(
                studentUserId, courseId);

        double percentage = totalLessons > 0 ? (completedLessons * 100.0 / totalLessons) : 0;

        CourseEnrollment enrollment = courseEnrollmentRepository.findByCourseIdAndStudentUserId(
                        courseId, studentUserId)
                .orElse(null);

        if (enrollment != null) {
            enrollment.setProgressPercentage(percentage);

            if (percentage >= 100.0 && enrollment.getStatus() == EnrollmentStatus.ACTIVE) {
                enrollment.setStatus(EnrollmentStatus.COMPLETED);
                enrollment.setCompletedAt(LocalDateTime.now());

                String courseTitle = courseRepository.findById(courseId)
                        .map(Course::getTitle)
                        .orElse("Unknown");
                notificationService.sendCourseCompletedNotification(studentUserId, courseTitle);
                logger.info("Student {} completed course '{}'", studentUserId, courseId);
            }

            courseEnrollmentRepository.save(enrollment);
        }
    }

    // --- Helper methods ---

    private List<CourseEnrollmentResponse.SessionCalendarLink> buildSessionCalendarLinks(String courseId, String courseTitle) {
        List<LiveSession> upcomingSessions = liveSessionRepository
                .findByCourseIdOrderByScheduledAtAsc(courseId)
                .stream()
                .filter(s -> s.getStatus() == LiveSessionStatus.SCHEDULED)
                .collect(Collectors.toList());

        List<CourseEnrollmentResponse.SessionCalendarLink> links = new ArrayList<>();
        for (LiveSession session : upcomingSessions) {
            String link = googleCalendarLinkService.generateLink(
                    "Live: " + session.getTitle() + " (" + courseTitle + ")",
                    "Live session for " + courseTitle,
                    session.getScheduledAt(),
                    session.getDurationMinutes()
            );
            links.add(new CourseEnrollmentResponse.SessionCalendarLink(
                    session.getTitle(), session.getScheduledAt(), session.getDurationMinutes(), link));
        }
        return links;
    }

    private String buildCalendarLinksSection(List<CourseEnrollmentResponse.SessionCalendarLink> sessionLinks) {
        if (sessionLinks.isEmpty()) {
            return "";
        }
        DateTimeFormatter displayFmt = DateTimeFormatter.ofPattern("MMM d, yyyy 'at' h:mm a");
        StringBuilder sb = new StringBuilder("Upcoming Live Sessions:\n");
        for (CourseEnrollmentResponse.SessionCalendarLink sl : sessionLinks) {
            sb.append("- ").append(sl.getSessionTitle())
              .append(" (").append(sl.getScheduledAt().format(displayFmt)).append(")\n")
              .append("  Add to Google Calendar: ").append(sl.getCalendarLink()).append("\n");
        }
        return sb.toString();
    }

    private CourseEnrollmentResponse toEnrollmentResponse(CourseEnrollment enrollment) {
        String courseTitle = courseRepository.findById(enrollment.getCourseId())
                .map(Course::getTitle)
                .orElse("Unknown");

        String studentDisplayName = userRepository.findById(enrollment.getStudentUserId())
                .map(User::getDisplayName)
                .orElse("Unknown");

        return new CourseEnrollmentResponse(
                enrollment.getId(),
                enrollment.getCourseId(),
                courseTitle,
                enrollment.getStudentUserId(),
                studentDisplayName,
                enrollment.getStatus().name(),
                enrollment.getPaidAmount(),
                enrollment.getProgressPercentage(),
                enrollment.getEnrolledAt(),
                enrollment.getCompletedAt()
        );
    }
}
