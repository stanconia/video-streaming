package com.videostreaming.scheduling.service;

import com.videostreaming.scheduling.model.CalendarBlock;
import com.videostreaming.scheduling.model.ClassStatus;
import com.videostreaming.scheduling.model.ScheduledClass;
import com.videostreaming.scheduling.repository.CalendarBlockRepository;
import com.videostreaming.scheduling.repository.ScheduledClassRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CalendarBlockService {

    private static final Logger logger = LoggerFactory.getLogger(CalendarBlockService.class);

    private final CalendarBlockRepository calendarBlockRepository;
    private final ScheduledClassRepository scheduledClassRepository;
    private final GoogleCalendarApiService googleCalendarApiService;

    public CalendarBlockService(CalendarBlockRepository calendarBlockRepository,
                                ScheduledClassRepository scheduledClassRepository,
                                GoogleCalendarApiService googleCalendarApiService) {
        this.calendarBlockRepository = calendarBlockRepository;
        this.scheduledClassRepository = scheduledClassRepository;
        this.googleCalendarApiService = googleCalendarApiService;
    }

    @Transactional
    public List<CalendarBlock> blockSlotsForEnrollment(String courseId, String studentUserId,
                                                       String teacherUserId, String enrollmentId) {
        List<CalendarBlock> blocks = new ArrayList<>();

        List<ScheduledClass> classes = scheduledClassRepository.findByCourseIdAndStatusIn(
                courseId, List.of(ClassStatus.OPEN, ClassStatus.FULL));

        for (ScheduledClass sc : classes) {
            LocalDateTime start = sc.getScheduledAt();
            LocalDateTime end = start.plusMinutes(sc.getDurationMinutes());

            // Block student's calendar
            CalendarBlock studentBlock = CalendarBlock.builder()
                    .userId(studentUserId)
                    .startTime(start)
                    .endTime(end)
                    .title(sc.getTitle())
                    .description("Enrolled class: " + sc.getTitle())
                    .sourceType("COURSE_ENROLLMENT")
                    .sourceId(enrollmentId)
                    .build();
            studentBlock = calendarBlockRepository.save(studentBlock);

            // Create Google Calendar event for student
            String studentGoogleEventId = googleCalendarApiService.createEvent(
                    studentUserId, sc.getTitle(), "Enrolled class: " + sc.getTitle(), start, end);
            if (studentGoogleEventId != null) {
                studentBlock.setGoogleCalendarEventId(studentGoogleEventId);
                studentBlock = calendarBlockRepository.save(studentBlock);
            }
            blocks.add(studentBlock);

            // Block teacher's calendar
            CalendarBlock teacherBlock = CalendarBlock.builder()
                    .userId(teacherUserId)
                    .startTime(start)
                    .endTime(end)
                    .title(sc.getTitle())
                    .description("Teaching class: " + sc.getTitle())
                    .sourceType("COURSE_ENROLLMENT")
                    .sourceId(enrollmentId)
                    .build();
            teacherBlock = calendarBlockRepository.save(teacherBlock);

            // Create Google Calendar event for teacher
            String teacherGoogleEventId = googleCalendarApiService.createEvent(
                    teacherUserId, sc.getTitle(), "Teaching class: " + sc.getTitle(), start, end);
            if (teacherGoogleEventId != null) {
                teacherBlock.setGoogleCalendarEventId(teacherGoogleEventId);
                teacherBlock = calendarBlockRepository.save(teacherBlock);
            }
            blocks.add(teacherBlock);

            logger.info("Blocked calendar slots for class '{}' - student: {}, teacher: {}",
                    sc.getTitle(), studentUserId, teacherUserId);
        }

        return blocks;
    }

    public boolean hasConflict(String userId, LocalDateTime start, LocalDateTime end) {
        return calendarBlockRepository.existsByUserIdAndStartTimeLessThanAndEndTimeGreaterThan(
                userId, end, start);
    }

    public List<CalendarBlock> getUserBlocks(String userId) {
        return calendarBlockRepository.findByUserIdOrderByStartTimeAsc(userId);
    }

    @Transactional
    public void removeBlocksForEnrollment(String enrollmentId) {
        List<CalendarBlock> blocks = calendarBlockRepository.findBySourceTypeAndSourceId(
                "COURSE_ENROLLMENT", enrollmentId);

        for (CalendarBlock block : blocks) {
            if (block.getGoogleCalendarEventId() != null) {
                googleCalendarApiService.deleteEvent(block.getUserId(), block.getGoogleCalendarEventId());
            }
        }

        logger.info("Removing {} calendar blocks for enrollment {}", blocks.size(), enrollmentId);
        calendarBlockRepository.deleteBySourceTypeAndSourceId("COURSE_ENROLLMENT", enrollmentId);
    }
}
