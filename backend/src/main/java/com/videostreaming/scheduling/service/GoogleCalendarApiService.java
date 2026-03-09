package com.videostreaming.scheduling.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.videostreaming.user.model.User;
import com.videostreaming.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

@Service
public class GoogleCalendarApiService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleCalendarApiService.class);

    private final UserRepository userRepository;

    @Value("${google.client-id:}")
    private String googleClientId;

    @Value("${google.client-secret:}")
    private String googleClientSecret;

    public GoogleCalendarApiService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String createEvent(String userId, String title, String description,
                               LocalDateTime startTime, LocalDateTime endTime) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getGoogleRefreshToken() == null) {
            logger.debug("User {} has no Google Calendar tokens, skipping event creation", userId);
            return null;
        }

        try {
            Calendar calendarService = buildCalendarService(user);

            Event event = new Event()
                    .setSummary(title)
                    .setDescription(description);

            ZoneId zone = ZoneId.systemDefault();

            EventDateTime start = new EventDateTime()
                    .setDateTime(new DateTime(Date.from(startTime.atZone(zone).toInstant())))
                    .setTimeZone(zone.getId());
            event.setStart(start);

            EventDateTime end = new EventDateTime()
                    .setDateTime(new DateTime(Date.from(endTime.atZone(zone).toInstant())))
                    .setTimeZone(zone.getId());
            event.setEnd(end);

            Event created = calendarService.events().insert("primary", event).execute();
            logger.info("Created Google Calendar event '{}' for user {}", created.getId(), userId);
            return created.getId();
        } catch (Exception e) {
            logger.warn("Failed to create Google Calendar event for user {}: {}", userId, e.getMessage());
            return null;
        }
    }

    public void deleteEvent(String userId, String googleEventId) {
        if (googleEventId == null) return;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getGoogleRefreshToken() == null) return;

        try {
            Calendar calendarService = buildCalendarService(user);
            calendarService.events().delete("primary", googleEventId).execute();
            logger.info("Deleted Google Calendar event '{}' for user {}", googleEventId, userId);
        } catch (Exception e) {
            logger.warn("Failed to delete Google Calendar event: {}", e.getMessage());
        }
    }

    @SuppressWarnings("deprecation")
    private Calendar buildCalendarService(User user) throws Exception {
        GoogleCredential credential = new GoogleCredential.Builder()
                .setTransport(new NetHttpTransport())
                .setJsonFactory(GsonFactory.getDefaultInstance())
                .setClientSecrets(googleClientId, googleClientSecret)
                .build()
                .setAccessToken(user.getGoogleAccessToken())
                .setRefreshToken(user.getGoogleRefreshToken());

        if (user.getGoogleTokenExpiresAt() != null &&
                user.getGoogleTokenExpiresAt().isBefore(LocalDateTime.now())) {
            credential.refreshToken();
            user.setGoogleAccessToken(credential.getAccessToken());
            user.setGoogleTokenExpiresAt(LocalDateTime.now().plusSeconds(
                    credential.getExpiresInSeconds()));
            userRepository.save(user);
        }

        return new Calendar.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance(), credential)
                .setApplicationName("EduLive")
                .build();
    }
}
