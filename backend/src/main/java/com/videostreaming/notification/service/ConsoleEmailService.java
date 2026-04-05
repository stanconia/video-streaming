package com.videostreaming.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Profile("!aws")
public class ConsoleEmailService implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(ConsoleEmailService.class);

    @Override
    public void sendEmail(String to, String subject, String body) {
        logger.info("=== EMAIL ===");
        logger.info("To: {}", to);
        logger.info("Subject: {}", subject);
        logger.info("Body:\n{}", body);
        logger.info("=============");
    }

    @Override
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        logger.info("=== HTML EMAIL ===");
        logger.info("To: {}", to);
        logger.info("Subject: {}", subject);
        logger.info("HTML Body:\n{}", htmlBody);
        logger.info("==================");
    }

    @Override
    public void sendTemplatedEmail(String to, String template, Map<String, String> variables) {
        String body = buildTemplate(template, variables);
        sendEmail(to, getSubjectForTemplate(template), body);
    }

    private String getSubjectForTemplate(String template) {
        return switch (template) {
            case "welcome" -> "Welcome to KyroAcademy!";
            case "booking_confirmation" -> "Booking Confirmed - KyroAcademy";
            case "class_created" -> "Class Created - KyroAcademy";
            case "class_reminder" -> "Class Reminder - KyroAcademy";
            case "enrollment_confirmation" -> "You're enrolled! - KyroAcademy";
            case "teacher_enrollment_notification" -> "New Student Enrolled - KyroAcademy";
            case "live_session_scheduled" -> "Live Session Scheduled - KyroAcademy";
            case "live_session_starting" -> "Live Session Starting Now! - KyroAcademy";
            case "password_reset" -> "Reset Your Password - KyroAcademy";
            default -> "KyroAcademy Notification";
        };
    }

    private String buildTemplate(String template, Map<String, String> variables) {
        return switch (template) {
            case "welcome" -> String.format(
                    "Hi %s,\n\nWelcome to KyroAcademy! Your account has been created successfully.\n\nStart exploring classes and connect with great teachers.\n\nBest,\nThe KyroAcademy Team",
                    variables.getOrDefault("displayName", "there"));
            case "booking_confirmation" -> String.format(
                    "Hi %s,\n\nYour booking for \"%s\" has been confirmed!\n\nScheduled: %s\nAmount paid: %s\n\nYou'll be able to join the class when the teacher starts it.\n\nBest,\nThe KyroAcademy Team",
                    variables.getOrDefault("studentName", "there"),
                    variables.getOrDefault("classTitle", ""),
                    variables.getOrDefault("scheduledAt", ""),
                    variables.getOrDefault("amount", ""));
            case "class_created" -> String.format(
                    "Hi %s,\n\nYour class \"%s\" has been created and is now listed!\n\nScheduled: %s\nMax students: %s\nPrice: %s\n\nStudents can now browse and book your class.\n\nBest,\nThe KyroAcademy Team",
                    variables.getOrDefault("teacherName", "there"),
                    variables.getOrDefault("classTitle", ""),
                    variables.getOrDefault("scheduledAt", ""),
                    variables.getOrDefault("maxStudents", ""),
                    variables.getOrDefault("price", ""));
            case "class_reminder" -> String.format(
                    "Hi %s,\n\nReminder: Your class \"%s\" starts at %s.\n\nBest,\nThe KyroAcademy Team",
                    variables.getOrDefault("name", "there"),
                    variables.getOrDefault("classTitle", ""),
                    variables.getOrDefault("scheduledAt", ""));
            case "enrollment_confirmation" -> String.format(
                    "Hi %s,\n\nYou've been enrolled in \"%s\"!\n\nTeacher: %s\n\nStart learning now at KyroAcademy.\n\n%sBest,\nThe KyroAcademy Team",
                    variables.getOrDefault("studentName", "there"),
                    variables.getOrDefault("courseName", ""),
                    variables.getOrDefault("teacherName", ""),
                    variables.containsKey("calendarLinks") ? variables.get("calendarLinks") + "\n" : "");
            case "teacher_enrollment_notification" -> String.format(
                    "Hi %s,\n\nGreat news! %s has enrolled in your course \"%s\".\n\nEnrollment Date: %s\n\nLog in to KyroAcademy to see your updated roster.\n\nBest,\nThe KyroAcademy Team",
                    variables.getOrDefault("teacherName", "there"),
                    variables.getOrDefault("studentName", "A student"),
                    variables.getOrDefault("courseTitle", ""),
                    variables.getOrDefault("enrollmentDate", ""));
            case "live_session_scheduled" -> String.format(
                    "Hi %s,\n\nA live session has been scheduled for your course!\n\nSession: %s\nCourse: %s\nDate & Time: %s\nDuration: %s\n\nAdd to Google Calendar: %s\n\nDon't miss it!\n\nBest,\nThe KyroAcademy Team",
                    variables.getOrDefault("studentName", "there"),
                    variables.getOrDefault("sessionTitle", ""),
                    variables.getOrDefault("courseTitle", ""),
                    variables.getOrDefault("scheduledAt", ""),
                    variables.getOrDefault("duration", ""),
                    variables.getOrDefault("calendarLink", ""));
            case "live_session_starting" -> String.format(
                    "Hi %s,\n\nThe live session \"%s\" for \"%s\" is starting now!\n\nJoin here: http://localhost:3001/room/%s/view\n\nBest,\nThe KyroAcademy Team",
                    variables.getOrDefault("studentName", "there"),
                    variables.getOrDefault("sessionTitle", ""),
                    variables.getOrDefault("courseTitle", ""),
                    variables.getOrDefault("roomId", ""));
            case "password_reset" -> String.format(
                    "Hi %s,\n\nWe received a request to reset your password. Click the link below to set a new password:\n\n%s\n\nThis link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.\n\nBest,\nThe KyroAcademy Team",
                    variables.getOrDefault("displayName", "there"),
                    variables.getOrDefault("resetLink", ""));
            default -> "You have a new notification from KyroAcademy.";
        };
    }
}
