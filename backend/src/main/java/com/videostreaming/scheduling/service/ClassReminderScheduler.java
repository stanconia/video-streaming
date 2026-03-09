package com.videostreaming.scheduling.service;

import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.scheduling.model.Booking;
import com.videostreaming.scheduling.model.BookingStatus;
import com.videostreaming.scheduling.model.ClassStatus;
import com.videostreaming.scheduling.model.ScheduledClass;
import com.videostreaming.scheduling.repository.BookingRepository;
import com.videostreaming.scheduling.repository.ScheduledClassRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ClassReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(ClassReminderScheduler.class);

    private final ScheduledClassRepository scheduledClassRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final Set<String> remindedClassIds = ConcurrentHashMap.newKeySet();

    public ClassReminderScheduler(ScheduledClassRepository scheduledClassRepository,
                                   BookingRepository bookingRepository,
                                   NotificationService notificationService) {
        this.scheduledClassRepository = scheduledClassRepository;
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedRate = 60000)
    public void sendClassReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneHourFromNow = now.plusMinutes(61);

        List<ScheduledClass> upcomingClasses = scheduledClassRepository
                .findByStatusInOrderByScheduledAtAsc(List.of(ClassStatus.OPEN, ClassStatus.FULL));

        for (ScheduledClass sc : upcomingClasses) {
            if (sc.getScheduledAt().isAfter(now) && sc.getScheduledAt().isBefore(oneHourFromNow)
                    && !remindedClassIds.contains(sc.getId())) {

                remindedClassIds.add(sc.getId());

                // Notify all booked students
                List<Booking> bookings = bookingRepository.findByClassIdAndStatus(sc.getId(), BookingStatus.CONFIRMED);
                for (Booking booking : bookings) {
                    notificationService.sendClassReminderNotification(
                            booking.getStudentUserId(), sc.getTitle(), sc.getScheduledAt().toString());
                }

                // Notify teacher
                notificationService.sendClassReminderNotification(
                        sc.getTeacherUserId(), sc.getTitle(), sc.getScheduledAt().toString());

                logger.info("Sent reminders for class '{}' ({}) to {} students + teacher",
                        sc.getTitle(), sc.getId(), bookings.size());
            }
        }
    }

    // Clear old entries every hour to prevent memory leak
    @Scheduled(fixedRate = 3600000)
    public void clearOldReminders() {
        remindedClassIds.clear();
        logger.debug("Cleared reminder cache");
    }
}
