package com.videostreaming.scheduling.controller;

import com.videostreaming.scheduling.dto.CalendarEventResponse;
import com.videostreaming.scheduling.service.CalendarService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private final CalendarService calendarService;

    public CalendarController(CalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @GetMapping("/events")
    public ResponseEntity<List<CalendarEventResponse>> getCalendarEvents(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(calendarService.getCalendarEvents(userId));
    }
}
