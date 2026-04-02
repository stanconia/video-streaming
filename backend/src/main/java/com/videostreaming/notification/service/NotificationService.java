package com.videostreaming.notification.service;

import com.videostreaming.course.service.GoogleCalendarLinkService;
import com.videostreaming.notification.model.Notification;
import com.videostreaming.notification.model.NotificationType;
import com.videostreaming.notification.template.EmailTemplateService;
import com.videostreaming.notification.dto.NotificationResponse;
import com.videostreaming.notification.repository.NotificationRepository;
import com.videostreaming.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final GoogleCalendarLinkService googleCalendarLinkService;

    public NotificationService(EmailService emailService,
                                EmailTemplateService emailTemplateService,
                                UserRepository userRepository,
                                NotificationRepository notificationRepository,
                                GoogleCalendarLinkService googleCalendarLinkService) {
        this.emailService = emailService;
        this.emailTemplateService = emailTemplateService;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.googleCalendarLinkService = googleCalendarLinkService;
    }

    public void sendWelcomeEmail(String userId) {
        userRepository.findById(userId).ifPresent(user -> {
            String htmlBody = emailTemplateService.welcomeEmail(user.getDisplayName());
            emailService.sendHtmlEmail(user.getEmail(), "Welcome to EduLive!", htmlBody);
            createNotification(userId, NotificationType.WELCOME,
                    "Welcome to EduLive!", "Welcome " + user.getDisplayName() + "! Start exploring classes.");
            logger.info("Sent welcome email to user {}", userId);
        });
    }

    public void sendPasswordResetEmail(String userId, String resetLink) {
        userRepository.findById(userId).ifPresent(user -> {
            String htmlBody = emailTemplateService.passwordReset(user.getDisplayName(), resetLink);
            emailService.sendHtmlEmail(user.getEmail(), "Reset Your Password - EduLive", htmlBody);
            logger.info("Sent password reset email to user {}", userId);
        });
    }

    public void sendReviewReceivedNotification(String teacherUserId, String studentName) {
        createNotification(teacherUserId, NotificationType.REVIEW_RECEIVED,
                "New Review", studentName + " left a review for your class.");
        logger.info("Sent review received notification to teacher {}", teacherUserId);
    }

    public void sendMessageNotification(String recipientUserId, String senderDisplayName) {
        createNotification(recipientUserId, NotificationType.MESSAGE_RECEIVED,
                "New Message", "You have a new message from " + senderDisplayName + ".");
        logger.info("Sent message notification to user {}", recipientUserId);
    }

    public void sendCertificateIssuedNotification(String studentUserId, String classTitle) {
        createNotification(studentUserId, NotificationType.CERTIFICATE_ISSUED,
                "Certificate Issued", "Your certificate for '" + classTitle + "' is ready!");
        logger.info("Sent certificate issued notification to user {}", studentUserId);
    }

    public void sendCourseEnrollmentNotification(String studentUserId, String courseTitle) {
        createNotification(studentUserId, NotificationType.COURSE_ENROLLED,
                "Course Enrolled", "You have successfully enrolled in '" + courseTitle + "'.");

        userRepository.findById(studentUserId).ifPresent(student -> {
            String htmlBody = emailTemplateService.enrollmentConfirmation(
                    student.getDisplayName(), courseTitle, null);
            emailService.sendHtmlEmail(student.getEmail(), "You're enrolled! - EduLive", htmlBody);
        });

        logger.info("Sent course enrollment notification to user {}", studentUserId);
    }

    public void sendCourseCompletedNotification(String studentUserId, String courseTitle) {
        createNotification(studentUserId, NotificationType.COURSE_COMPLETED,
                "Course Completed", "Congratulations! You have completed '" + courseTitle + "'.");
        logger.info("Sent course completed notification to user {}", studentUserId);
    }

    public void sendAssignmentGradedNotification(String studentUserId, String assignmentTitle,
                                                   int score, int maxScore, String courseId) {
        createNotification(studentUserId, NotificationType.ASSIGNMENT_GRADED,
                "Assignment Graded",
                "Your assignment '" + assignmentTitle + "' has been graded: " + score + "/" + maxScore + ".",
                "{\"link\":\"/courses/" + courseId + "\"}");
        logger.info("Sent assignment graded notification to user {}", studentUserId);
    }

    public void sendAssignmentSubmittedNotification(String teacherUserId, String studentName,
                                                      String assignmentTitle, String courseId) {
        createNotification(teacherUserId, NotificationType.ASSIGNMENT_SUBMITTED,
                "Assignment Submitted",
                studentName + " submitted '" + assignmentTitle + "'.",
                "{\"link\":\"/courses/" + courseId + "\"}");
        logger.info("Sent assignment submitted notification to teacher {}", teacherUserId);
    }

    public void sendDiscussionReplyNotification(String threadAuthorUserId, String replierName,
                                                  String threadTitle, String courseId) {
        createNotification(threadAuthorUserId, NotificationType.DISCUSSION_REPLY,
                "New Discussion Reply",
                replierName + " replied to your thread '" + threadTitle + "'.",
                "{\"link\":\"/courses/" + courseId + "\"}");
        logger.info("Sent discussion reply notification to user {}", threadAuthorUserId);
    }

    public void sendQuizResultNotification(String studentUserId, String quizTitle,
                                             double percentage, boolean passed, String courseId) {
        String status = passed ? "Passed" : "Failed";
        createNotification(studentUserId, NotificationType.QUIZ_RESULT,
                "Quiz Result: " + status,
                "You scored " + String.format("%.0f", percentage) + "% on '" + quizTitle + "'.",
                "{\"link\":\"/courses/" + courseId + "\"}");
        logger.info("Sent quiz result notification to user {}", studentUserId);
    }

    public void sendReviewReplyNotification(String studentUserId, String teacherName) {
        createNotification(studentUserId, NotificationType.REVIEW_REPLY,
                "Teacher Replied to Your Review",
                teacherName + " replied to your review.");
        logger.info("Sent review reply notification to user {}", studentUserId);
    }

    public void sendApplicationApprovedNotification(String userId) {
        createNotification(userId, NotificationType.APPLICATION_APPROVED,
                "Application Approved",
                "Congratulations! Your teacher application has been approved. You can now create classes.");
        logger.info("Sent application approved notification to user {}", userId);
    }

    public void sendApplicationRejectedNotification(String userId) {
        createNotification(userId, NotificationType.APPLICATION_REJECTED,
                "Application Update",
                "Your teacher application was not approved at this time. You may reapply.");
        logger.info("Sent application rejected notification to user {}", userId);
    }

    public void sendClassBookedNotification(String teacherUserId, String studentName, String classTitle) {
        createNotification(teacherUserId, NotificationType.CLASS_BOOKED,
                "New Booking",
                studentName + " booked your class '" + classTitle + "'.");
        logger.info("Sent class booked notification to teacher {}", teacherUserId);
    }

    public void sendClassCancelledNotification(String studentUserId, String classTitle) {
        createNotification(studentUserId, NotificationType.CLASS_CANCELLED,
                "Class Cancelled",
                "The class '" + classTitle + "' has been cancelled by the teacher.");
        logger.info("Sent class cancelled notification to user {}", studentUserId);
    }

    public void sendWaitlistPromotedNotification(String studentUserId, String classTitle) {
        createNotification(studentUserId, NotificationType.WAITLIST_PROMOTED,
                "Waitlist Update",
                "A spot opened up! You've been booked into '" + classTitle + "'.");
        logger.info("Sent waitlist promoted notification to user {}", studentUserId);
    }

    public void sendClassReminderNotification(String userId, String classTitle, String scheduledAt) {
        createNotification(userId, NotificationType.CLASS_REMINDER,
                "Class Starting Soon",
                "Your class '" + classTitle + "' starts at " + scheduledAt + ".");
        userRepository.findById(userId).ifPresent(user ->
                emailService.sendTemplatedEmail(user.getEmail(), "class_reminder",
                        Map.of("name", user.getDisplayName(), "classTitle", classTitle, "scheduledAt", scheduledAt)));
        logger.info("Sent class reminder notification to user {}", userId);
    }

    public void sendPaymentReleasedNotification(String teacherUserId, double amount, String classTitle) {
        createNotification(teacherUserId, NotificationType.PAYMENT_RELEASED,
                "Payment Released",
                String.format("$%.2f has been released for your class '%s'.", amount, classTitle));
        logger.info("Sent payment released notification to teacher {}", teacherUserId);
    }

    public void sendPayoutCompletedNotification(String teacherUserId, double amount) {
        createNotification(teacherUserId, NotificationType.PAYOUT_COMPLETED,
                "Payout Completed",
                String.format("$%.2f has been transferred to your bank account.", amount));
        logger.info("Sent payout completed notification to teacher {}", teacherUserId);
    }

    public void sendLiveSessionScheduledNotification(String studentUserId, String sessionTitle,
                                                        String courseTitle, LocalDateTime scheduledAt, int durationMinutes) {
        String formattedTime = scheduledAt.format(DateTimeFormatter.ofPattern("MMM d, yyyy 'at' h:mm a"));
        createNotification(studentUserId, NotificationType.LIVE_SESSION_SCHEDULED,
                "Live Session Scheduled",
                "A live session '" + sessionTitle + "' has been scheduled for '" + courseTitle + "' on " + formattedTime + ".");

        String calendarLink = googleCalendarLinkService.generateLink(
                "Live: " + sessionTitle + " (" + courseTitle + ")",
                "Live session for course: " + courseTitle + "\n\nJoin at EduLive when the session starts.",
                scheduledAt, durationMinutes);

        userRepository.findById(studentUserId).ifPresent(student -> {
            String htmlBody = emailTemplateService.sessionReminder(
                    student.getDisplayName(), sessionTitle, formattedTime, calendarLink);
            emailService.sendHtmlEmail(student.getEmail(), "Live Session Scheduled - EduLive", htmlBody);
        });

        logger.info("Sent live session scheduled notification to user {}", studentUserId);
    }

    public void sendNewStudentEnrolledNotification(String teacherUserId, String studentName,
                                                       String courseTitle, String courseId) {
        createNotification(teacherUserId, NotificationType.NEW_STUDENT_ENROLLED,
                "New Student Enrolled",
                studentName + " has enrolled in your course '" + courseTitle + "'.",
                "{\"link\":\"/courses/" + courseId + "\"}");

        userRepository.findById(teacherUserId).ifPresent(teacher ->
                emailService.sendTemplatedEmail(teacher.getEmail(), "teacher_enrollment_notification",
                        Map.of("teacherName", teacher.getDisplayName(),
                               "studentName", studentName,
                               "courseTitle", courseTitle,
                               "enrollmentDate", java.time.LocalDate.now().toString())));

        logger.info("Sent new student enrolled notification to teacher {}", teacherUserId);
    }

    public void sendLiveSessionStartingNotification(String studentUserId, String sessionTitle,
                                                       String courseTitle, String roomId) {
        createNotification(studentUserId, NotificationType.LIVE_SESSION_STARTING,
                "Live Session Starting!",
                "'" + sessionTitle + "' is starting now! Join to participate.",
                "{\"link\":\"/room/" + roomId + "/view\"}");

        userRepository.findById(studentUserId).ifPresent(student -> {
            String joinUrl = "/room/" + roomId + "/view";
            String htmlBody = emailTemplateService.sessionReminder(
                    student.getDisplayName(), sessionTitle, "Starting now!", joinUrl);
            emailService.sendHtmlEmail(student.getEmail(), "Live Session Starting Now! - EduLive", htmlBody);
        });

        logger.info("Sent live session starting notification to user {}", studentUserId);
    }

    // In-app notification retrieval methods

    public Page<NotificationResponse> getNotifications(String userId, int page, int size) {
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size));
        return notifications.map(this::toResponse);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("Cannot mark another user's notification as read");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String userId) {
        notificationRepository.markAllAsRead(userId);
    }

    private void createNotification(String userId, NotificationType type, String title, String message) {
        createNotification(userId, type, title, message, null);
    }

    private void createNotification(String userId, NotificationType type, String title, String message, String data) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .data(data)
                .build();
        notificationRepository.save(notification);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getType().name(), n.getTitle(), n.getMessage(),
                n.getData(), n.isRead(), n.getCreatedAt());
    }
}
