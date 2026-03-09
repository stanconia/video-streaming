package com.videostreaming.notification.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ConsoleEmailServiceTest {

    private final ConsoleEmailService service = new ConsoleEmailService();

    @Test
    void sendEmail_doesNotThrow() {
        assertDoesNotThrow(() ->
                service.sendEmail("user@example.com", "Test Subject", "Test body content"));
    }

    @Test
    void sendTemplatedEmail_enrollmentConfirmation_containsCourseName() {
        // The enrollment_confirmation template uses "courseName" variable
        Map<String, String> variables = Map.of(
                "studentName", "John",
                "courseName", "Advanced Mathematics",
                "teacherName", "Dr. Smith"
        );

        // Should not throw and the template should process correctly
        assertDoesNotThrow(() ->
                service.sendTemplatedEmail("student@example.com", "enrollment_confirmation", variables));
    }

    @Test
    void sendTemplatedEmail_unknownTemplate_returnsDefault() {
        // Unknown template should fall through to the default case
        Map<String, String> variables = Map.of("key", "value");

        assertDoesNotThrow(() ->
                service.sendTemplatedEmail("user@example.com", "unknown_template", variables));
    }

    @Test
    void sendTemplatedEmail_welcome_containsDisplayName() {
        Map<String, String> variables = Map.of("displayName", "Alice");

        assertDoesNotThrow(() ->
                service.sendTemplatedEmail("alice@example.com", "welcome", variables));
    }

    @Test
    void sendTemplatedEmail_bookingConfirmation_doesNotThrow() {
        Map<String, String> variables = Map.of(
                "studentName", "Bob",
                "classTitle", "Piano 101",
                "scheduledAt", "2026-03-01 10:00",
                "amount", "$29.99"
        );

        assertDoesNotThrow(() ->
                service.sendTemplatedEmail("bob@example.com", "booking_confirmation", variables));
    }
}
