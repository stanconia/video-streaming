package com.videostreaming.course.service;

import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class GoogleCalendarLinkService {

    private static final String CALENDAR_BASE = "https://calendar.google.com/calendar/render";
    private static final DateTimeFormatter CALENDAR_FMT = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");

    public String generateLink(String title, String description, LocalDateTime startDate) {
        return generateLink(title, description, startDate, 60);
    }

    public String generateLink(String title, String description, LocalDateTime startDate, int durationMinutes) {
        LocalDateTime endDate = startDate.plusMinutes(durationMinutes);

        // No Z suffix — Google Calendar uses the viewer's timezone setting,
        // which matches how teachers enter local time via datetime-local input
        String dates = startDate.format(CALENDAR_FMT) + "/" + endDate.format(CALENDAR_FMT);

        return CALENDAR_BASE + "?action=TEMPLATE" +
                "&text=" + encode(title) +
                "&dates=" + dates +
                "&details=" + encode(description);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
