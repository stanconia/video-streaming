package com.videostreaming.scheduling.service;

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
import com.videostreaming.scheduling.dto.CalendarEventResponse;
import com.videostreaming.scheduling.repository.BookingRepository;
import com.videostreaming.scheduling.repository.CalendarBlockRepository;
import com.videostreaming.scheduling.repository.ScheduledClassRepository;
import com.videostreaming.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class CalendarService {

    private final BookingRepository bookingRepository;
    private final ScheduledClassRepository scheduledClassRepository;
    private final UserRepository userRepository;
    private final CalendarBlockRepository calendarBlockRepository;

    public CalendarService(BookingRepository bookingRepository,
                           ScheduledClassRepository scheduledClassRepository,
                           UserRepository userRepository,
                           CalendarBlockRepository calendarBlockRepository) {
        this.bookingRepository = bookingRepository;
        this.scheduledClassRepository = scheduledClassRepository;
        this.userRepository = userRepository;
        this.calendarBlockRepository = calendarBlockRepository;
    }

    public List<CalendarEventResponse> getCalendarEvents(String userId) {
        List<CalendarEventResponse> events = new ArrayList<>();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return events;

        // Student bookings → "enrolled" events
        List<Booking> bookings = bookingRepository.findByStudentUserIdOrderByCreatedAtDesc(userId);
        for (Booking booking : bookings) {
            if (booking.getStatus() == BookingStatus.CANCELLED) continue;
            scheduledClassRepository.findById(booking.getClassId()).ifPresent(sc -> {
                events.add(new CalendarEventResponse(
                        booking.getId(),
                        sc.getTitle(),
                        sc.getScheduledAt().toLocalDate().toString(),
                        sc.getScheduledAt().toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm")),
                        sc.getDurationMinutes(),
                        "enrolled",
                        sc.getStatus().name(),
                        sc.getId()));
            });
        }

        // Teacher classes → "teaching" events
        if (user.getRole() == UserRole.TEACHER) {
            List<ScheduledClass> teacherClasses = scheduledClassRepository
                    .findByTeacherUserIdOrderByScheduledAtDesc(userId);
            for (ScheduledClass sc : teacherClasses) {
                if (sc.getStatus() == ClassStatus.CANCELLED) continue;
                events.add(new CalendarEventResponse(
                        sc.getId(),
                        sc.getTitle(),
                        sc.getScheduledAt().toLocalDate().toString(),
                        sc.getScheduledAt().toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm")),
                        sc.getDurationMinutes(),
                        "teaching",
                        sc.getStatus().name(),
                        sc.getId()));
            }
        }

        // Calendar blocks (from course enrollments)
        List<CalendarBlock> userBlocks = calendarBlockRepository.findByUserIdOrderByStartTimeAsc(userId);
        for (CalendarBlock block : userBlocks) {
            events.add(new CalendarEventResponse(
                    block.getId(),
                    block.getTitle(),
                    block.getStartTime().toLocalDate().toString(),
                    block.getStartTime().toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm")),
                    (int) Duration.between(block.getStartTime(), block.getEndTime()).toMinutes(),
                    "blocked",
                    "BLOCKED",
                    null));
        }

        return events;
    }
}
