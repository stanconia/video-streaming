package com.videostreaming.scheduling.service;

import com.videostreaming.live.service.RoomService;
import com.videostreaming.notification.service.NotificationService;
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
import com.videostreaming.scheduling.dto.ClassSearchResponse;
import com.videostreaming.scheduling.dto.CreateScheduledClassRequest;
import com.videostreaming.scheduling.dto.ScheduledClassResponse;
import com.videostreaming.scheduling.repository.BookingRepository;
import com.videostreaming.scheduling.repository.ScheduledClassRepository;
import com.videostreaming.teacher.repository.TeacherProfileRepository;
import com.videostreaming.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ScheduledClassService {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledClassService.class);

    private final ScheduledClassRepository scheduledClassRepository;
    private final UserRepository userRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final RoomService roomService;
    private final NotificationService notificationService;
    private final BookingRepository bookingRepository;

    public ScheduledClassService(ScheduledClassRepository scheduledClassRepository,
                                  UserRepository userRepository,
                                  TeacherProfileRepository teacherProfileRepository,
                                  RoomService roomService,
                                  NotificationService notificationService,
                                  BookingRepository bookingRepository) {
        this.scheduledClassRepository = scheduledClassRepository;
        this.userRepository = userRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.roomService = roomService;
        this.notificationService = notificationService;
        this.bookingRepository = bookingRepository;
    }

    @Transactional
    public ScheduledClassResponse createClass(String teacherUserId, CreateScheduledClassRequest request) {
        User teacher = userRepository.findById(teacherUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (teacher.getRole() != UserRole.TEACHER) {
            throw new RuntimeException("Only teachers can create classes");
        }

        LocalDateTime scheduledAt = LocalDateTime.parse(request.getScheduledAt());

        ScheduledClass sc = ScheduledClass.builder()
                .teacherUserId(teacherUserId)
                .title(request.getTitle())
                .description(request.getDescription())
                .subject(request.getSubject())
                .scheduledAt(scheduledAt)
                .durationMinutes(request.getDurationMinutes())
                .maxStudents(request.getMaxStudents())
                .price(request.getPrice())
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .ageMin(request.getAgeMin())
                .ageMax(request.getAgeMax())
                .tags(request.getTags())
                .thumbnailUrl(request.getThumbnailUrl())
                .courseId(request.getCourseId())
                .build();

        sc = scheduledClassRepository.save(sc);
        logger.info("Created scheduled class '{}' by teacher {}", sc.getTitle(), teacherUserId);
        return toResponse(sc);
    }

    public List<ScheduledClassResponse> getUpcomingClasses(String subject) {
        List<ClassStatus> openStatuses = List.of(ClassStatus.OPEN, ClassStatus.FULL);
        List<ScheduledClass> classes;
        if (subject != null && !subject.isEmpty()) {
            classes = scheduledClassRepository.findBySubjectAndStatusInOrderByScheduledAtAsc(subject, openStatuses);
        } else {
            classes = scheduledClassRepository.findByStatusInOrderByScheduledAtAsc(openStatuses);
        }
        return classes.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ScheduledClassResponse getClass(String classId) {
        ScheduledClass sc = scheduledClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        return toResponse(sc);
    }

    public List<ScheduledClassResponse> getMyClasses(String teacherUserId) {
        return scheduledClassRepository.findByTeacherUserIdOrderByScheduledAtDesc(teacherUserId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ScheduledClassResponse startClass(String classId, String teacherUserId) {
        ScheduledClass sc = scheduledClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (!sc.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the class teacher can start it");
        }

        if (sc.getStatus() != ClassStatus.OPEN && sc.getStatus() != ClassStatus.FULL) {
            throw new RuntimeException("Class cannot be started in current status: " + sc.getStatus());
        }

        // Create a Room for the live session
        Room room = roomService.createRoom(sc.getTitle());
        sc.setRoomId(room.getId());
        sc.setStatus(ClassStatus.IN_PROGRESS);
        sc = scheduledClassRepository.save(sc);

        logger.info("Started class '{}' with room {}", sc.getTitle(), room.getId());
        return toResponse(sc);
    }

    @Transactional
    public ScheduledClassResponse cancelClass(String classId, String teacherUserId) {
        ScheduledClass sc = scheduledClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (!sc.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the class teacher can cancel it");
        }

        sc.setStatus(ClassStatus.CANCELLED);
        sc = scheduledClassRepository.save(sc);

        // Notify all booked students
        List<Booking> confirmedBookings = bookingRepository.findByClassIdAndStatus(classId, BookingStatus.CONFIRMED);
        for (Booking booking : confirmedBookings) {
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setCancelledAt(LocalDateTime.now());
            notificationService.sendClassCancelledNotification(booking.getStudentUserId(), sc.getTitle());
        }

        logger.info("Cancelled class '{}' by teacher {}", sc.getTitle(), teacherUserId);
        return toResponse(sc);
    }

    public ClassSearchResponse searchClasses(String query, String subject, Double minPrice, Double maxPrice,
                                              String dateFrom, String dateTo, String sort, String dir,
                                              int page, int size) {
        List<String> statuses = List.of(ClassStatus.OPEN.name(), ClassStatus.FULL.name());

        LocalDateTime dateFromParsed = dateFrom != null ? LocalDateTime.parse(dateFrom + "T00:00:00") : null;
        LocalDateTime dateToParsed = dateTo != null ? LocalDateTime.parse(dateTo + "T23:59:59") : null;

        String sortField = "scheduled_at";
        if ("price".equals(sort)) sortField = "price";
        else if ("title".equals(sort)) sortField = "title";
        else if ("newest".equals(sort)) sortField = "created_at";

        Sort.Direction direction = "desc".equalsIgnoreCase(dir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        Page<ScheduledClass> resultPage = scheduledClassRepository.searchClasses(
                statuses, subject != null ? subject : "", query != null ? query : "",
                minPrice, maxPrice, dateFromParsed, dateToParsed, pageable);

        List<ScheduledClassResponse> content = resultPage.getContent().stream()
                .map(this::toResponse).collect(Collectors.toList());

        return new ClassSearchResponse(content, resultPage.getTotalElements(),
                resultPage.getTotalPages(), resultPage.getNumber(), resultPage.getSize());
    }

    @Transactional
    public void incrementEnrolledCount(String classId) {
        ScheduledClass sc = scheduledClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        sc.setEnrolledStudents(sc.getEnrolledStudents() + 1);
        if (sc.getEnrolledStudents() >= sc.getMaxStudents()) {
            sc.setStatus(ClassStatus.FULL);
        }
        scheduledClassRepository.save(sc);
    }

    @Transactional
    public void decrementEnrolledCount(String classId) {
        ScheduledClass sc = scheduledClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        sc.setEnrolledStudents(Math.max(0, sc.getEnrolledStudents() - 1));
        if (sc.getStatus() == ClassStatus.FULL && sc.getEnrolledStudents() < sc.getMaxStudents()) {
            sc.setStatus(ClassStatus.OPEN);
        }
        scheduledClassRepository.save(sc);
    }

    @Transactional
    public void updateWaitlistCount(String classId, int count) {
        ScheduledClass sc = scheduledClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        sc.setWaitlistCount(count);
        scheduledClassRepository.save(sc);
    }

    @Transactional
    public ScheduledClassResponse completeClass(String classId, String teacherUserId) {
        ScheduledClass sc = scheduledClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        if (!sc.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the class teacher can complete it");
        }
        sc.setStatus(ClassStatus.COMPLETED);
        sc = scheduledClassRepository.save(sc);
        logger.info("Completed class '{}' by teacher {}", sc.getTitle(), teacherUserId);
        return toResponse(sc);
    }

    private ScheduledClassResponse toResponse(ScheduledClass sc) {
        String teacherDisplayName = userRepository.findById(sc.getTeacherUserId())
                .map(User::getDisplayName).orElse("Unknown");

        Double teacherRating = teacherProfileRepository.findByUserId(sc.getTeacherUserId())
                .map(TeacherProfile::getAverageRating).orElse(null);

        return new ScheduledClassResponse(
                sc.getId(), sc.getTeacherUserId(), teacherDisplayName,
                sc.getTitle(), sc.getDescription(), sc.getSubject(),
                sc.getScheduledAt(), sc.getDurationMinutes(), sc.getMaxStudents(),
                sc.getEnrolledStudents(), sc.getPrice(), sc.getCurrency(),
                sc.getStatus().name(), sc.getAgeMin(), sc.getAgeMax(),
                sc.getTags(), sc.getThumbnailUrl(), teacherRating,
                sc.getWaitlistCount(), sc.getRoomId(), sc.getSeriesId(),
                null, 0, sc.getCreatedAt());
    }
}
