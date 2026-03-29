package com.videostreaming.course.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.junit.jupiter.api.Assertions.*;

class GoogleCalendarLinkServiceTest {

    private GoogleCalendarLinkService googleCalendarLinkService;

    private static final String CALENDAR_BASE = "https://calendar.google.com/calendar/render";

    @BeforeEach
    void setUp() {
        googleCalendarLinkService = new GoogleCalendarLinkService();
    }

    @Test
    void generateLink_containsBaseUrl() {
        String link = googleCalendarLinkService.generateLink(
                "Test Event", "Description", LocalDateTime.of(2025, 6, 15, 10, 0));

        assertTrue(link.startsWith(CALENDAR_BASE));
    }

    @Test
    void generateLink_containsActionTemplate() {
        String link = googleCalendarLinkService.generateLink(
                "Test Event", "Description", LocalDateTime.of(2025, 6, 15, 10, 0));

        assertTrue(link.contains("action=TEMPLATE"));
    }

    @Test
    void generateLink_encodesSpecialCharsInTitle() {
        String link = googleCalendarLinkService.generateLink(
                "Java & Spring Boot Course", "A great course", LocalDateTime.of(2025, 6, 15, 10, 0));

        // Spaces should be encoded as + or %20, & should be encoded as %26
        assertTrue(link.contains("text="));
        // The title should not contain raw spaces or raw ampersand in the URL
        assertFalse(link.contains("text=Java & Spring"));
        // Verify the encoded title is present (URLEncoder uses + for spaces and %26 for &)
        assertTrue(link.contains("Java"));
        assertTrue(link.contains("Spring"));
    }

    @Test
    void generateLink_encodesSpecialCharsInDescription() {
        String link = googleCalendarLinkService.generateLink(
                "Event", "Details with spaces & special <chars>", LocalDateTime.of(2025, 6, 15, 10, 0));

        assertTrue(link.contains("details="));
        // Raw angle brackets and ampersand should be encoded
        assertFalse(link.contains("details=Details with spaces & special <chars>"));
    }

    @Test
    void generateLink_correctDateFormat() {
        LocalDateTime startDate = LocalDateTime.of(2025, 6, 15, 10, 30, 0);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");
        String expectedStart = startDate.format(fmt);
        String expectedEnd = startDate.plusHours(1).format(fmt);

        String link = googleCalendarLinkService.generateLink(
                "Event", "Description", startDate);

        assertTrue(link.contains("dates="));
        // The "/" separator should NOT be URL-encoded
        assertTrue(link.contains(expectedStart + "/" + expectedEnd));
    }

    @Test
    void generateLink_endDateIsOneHourAfterStart() {
        LocalDateTime startDate = LocalDateTime.of(2025, 12, 25, 14, 0, 0);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");
        String expectedStart = startDate.format(fmt);
        String expectedEnd = startDate.plusHours(1).format(fmt);

        String link = googleCalendarLinkService.generateLink(
                "Christmas Event", "Holiday", startDate);

        assertTrue(link.contains(expectedStart + "/" + expectedEnd));
    }

    @Test
    void generateLink_containsAllRequiredParameters() {
        String link = googleCalendarLinkService.generateLink(
                "Title", "Desc", LocalDateTime.of(2025, 1, 1, 9, 0));

        assertTrue(link.contains("action=TEMPLATE"));
        assertTrue(link.contains("&text="));
        assertTrue(link.contains("&dates="));
        assertTrue(link.contains("&details="));
    }

    @Test
    void generateLink_emptyTitleAndDescription_doesNotThrow() {
        assertDoesNotThrow(() -> {
            String link = googleCalendarLinkService.generateLink(
                    "", "", LocalDateTime.of(2025, 1, 1, 0, 0));
            assertNotNull(link);
            assertTrue(link.startsWith(CALENDAR_BASE));
        });
    }
}
