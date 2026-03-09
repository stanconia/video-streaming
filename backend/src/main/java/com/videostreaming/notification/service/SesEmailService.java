package com.videostreaming.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

import java.util.Map;

@Service
@Profile("aws")
public class SesEmailService implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(SesEmailService.class);

    private final SesClient sesClient;
    private final String senderEmail;

    public SesEmailService(@Value("${aws.region:us-east-1}") String region,
                           @Value("${aws.ses.sender-email:noreply@edulive.com}") String senderEmail) {
        this.sesClient = SesClient.builder()
                .region(Region.of(region))
                .build();
        this.senderEmail = senderEmail;
    }

    @Override
    public void sendEmail(String to, String subject, String body) {
        try {
            SendEmailRequest request = SendEmailRequest.builder()
                    .source(senderEmail)
                    .destination(Destination.builder().toAddresses(to).build())
                    .message(Message.builder()
                            .subject(Content.builder().data(subject).charset("UTF-8").build())
                            .body(Body.builder()
                                    .text(Content.builder().data(body).charset("UTF-8").build())
                                    .build())
                            .build())
                    .build();
            sesClient.sendEmail(request);
            logger.info("Email sent via SES to: {}", to);
        } catch (Exception e) {
            logger.error("Failed to send email via SES to {}: {}", to, e.getMessage());
        }
    }

    @Override
    public void sendTemplatedEmail(String to, String template, Map<String, String> variables) {
        String subject = getSubjectForTemplate(template);
        String body = buildTemplate(template, variables);
        sendEmail(to, subject, body);
    }

    private String getSubjectForTemplate(String template) {
        return switch (template) {
            case "welcome" -> "Welcome to EduLive!";
            case "booking_confirmation" -> "Booking Confirmed - EduLive";
            case "class_created" -> "Class Created - EduLive";
            case "class_reminder" -> "Class Reminder - EduLive";
            case "enrollment_confirmation" -> "You're enrolled! - EduLive";
            case "teacher_enrollment_notification" -> "New Student Enrolled - EduLive";
            default -> "EduLive Notification";
        };
    }

    private String buildTemplate(String template, Map<String, String> variables) {
        return switch (template) {
            case "welcome" -> String.format(
                    "Hi %s,\n\nWelcome to EduLive! Your account has been created successfully.\n\nStart exploring courses and connect with great teachers.\n\nBest,\nThe EduLive Team",
                    variables.getOrDefault("displayName", "there"));
            case "booking_confirmation" -> String.format(
                    "Hi %s,\n\nYour booking for \"%s\" has been confirmed!\n\nScheduled: %s\nAmount paid: %s\n\nBest,\nThe EduLive Team",
                    variables.getOrDefault("studentName", "there"),
                    variables.getOrDefault("classTitle", ""),
                    variables.getOrDefault("scheduledAt", ""),
                    variables.getOrDefault("amount", ""));
            case "class_created" -> String.format(
                    "Hi %s,\n\nYour class \"%s\" has been created!\n\nScheduled: %s\nMax students: %s\nPrice: %s\n\nBest,\nThe EduLive Team",
                    variables.getOrDefault("teacherName", "there"),
                    variables.getOrDefault("classTitle", ""),
                    variables.getOrDefault("scheduledAt", ""),
                    variables.getOrDefault("maxStudents", ""),
                    variables.getOrDefault("price", ""));
            case "class_reminder" -> String.format(
                    "Hi %s,\n\nReminder: Your class \"%s\" starts at %s.\n\nBest,\nThe EduLive Team",
                    variables.getOrDefault("name", "there"),
                    variables.getOrDefault("classTitle", ""),
                    variables.getOrDefault("scheduledAt", ""));
            case "enrollment_confirmation" -> String.format(
                    "Hi %s,\n\nYou've been enrolled in \"%s\"!\n\nTeacher: %s\n\nStart learning now at EduLive.\n\n%sBest,\nThe EduLive Team",
                    variables.getOrDefault("studentName", "there"),
                    variables.getOrDefault("courseName", ""),
                    variables.getOrDefault("teacherName", ""),
                    variables.containsKey("calendarLink") ? "Add to Google Calendar: " + variables.get("calendarLink") + "\n\n" : "");
            case "teacher_enrollment_notification" -> String.format(
                    "Hi %s,\n\nGreat news! %s has enrolled in your course \"%s\".\n\nEnrollment Date: %s\n\nLog in to EduLive to see your updated roster.\n\nBest,\nThe EduLive Team",
                    variables.getOrDefault("teacherName", "there"),
                    variables.getOrDefault("studentName", "A student"),
                    variables.getOrDefault("courseTitle", ""),
                    variables.getOrDefault("enrollmentDate", ""));
            default -> "You have a new notification from EduLive.";
        };
    }
}
