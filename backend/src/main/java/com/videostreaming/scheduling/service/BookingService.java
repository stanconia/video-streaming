package com.videostreaming.scheduling.service;

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
import com.videostreaming.scheduling.dto.BookingResponse;
import com.videostreaming.scheduling.dto.CreateBookingRequest;
import com.videostreaming.scheduling.repository.BookingRepository;
import com.videostreaming.scheduling.repository.ScheduledClassRepository;
import com.videostreaming.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private static final Logger logger = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookingRepository;
    private final ScheduledClassRepository scheduledClassRepository;
    private final ScheduledClassService scheduledClassService;
    private final WaitlistService waitlistService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public BookingService(BookingRepository bookingRepository,
                          ScheduledClassRepository scheduledClassRepository,
                          ScheduledClassService scheduledClassService,
                          WaitlistService waitlistService,
                          NotificationService notificationService,
                          UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.scheduledClassRepository = scheduledClassRepository;
        this.scheduledClassService = scheduledClassService;
        this.waitlistService = waitlistService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @Transactional
    public BookingResponse bookClass(String studentUserId, CreateBookingRequest request) {
        ScheduledClass sc = scheduledClassRepository.findById(request.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (sc.getStatus() != ClassStatus.OPEN) {
            throw new RuntimeException("Class is not available for booking (status: " + sc.getStatus() + ")");
        }

        if (sc.getTeacherUserId().equals(studentUserId)) {
            throw new RuntimeException("Teachers cannot book their own classes");
        }

        if (bookingRepository.existsByClassIdAndStudentUserIdAndStatus(
                request.getClassId(), studentUserId, BookingStatus.CONFIRMED)) {
            throw new RuntimeException("You have already booked this class");
        }

        Booking booking = Booking.builder()
                .classId(request.getClassId())
                .studentUserId(studentUserId)
                .paidAmount(sc.getPrice())
                .paymentIntentId(request.getPaymentIntentId())
                .build();

        booking = bookingRepository.save(booking);

        // Increment enrolled count (may set class to FULL)
        scheduledClassService.incrementEnrolledCount(request.getClassId());

        // Notify teacher
        String studentName = userRepository.findById(studentUserId)
                .map(User::getDisplayName).orElse("A student");
        notificationService.sendClassBookedNotification(sc.getTeacherUserId(), studentName, sc.getTitle());

        logger.info("User {} booked class '{}'", studentUserId, sc.getTitle());
        return toResponse(booking);
    }

    public List<BookingResponse> getMyBookings(String studentUserId) {
        return bookingRepository.findByStudentUserIdOrderByCreatedAtDesc(studentUserId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponse cancelBooking(String bookingId, String userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getStudentUserId().equals(userId)) {
            throw new RuntimeException("You can only cancel your own bookings");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new RuntimeException("Only confirmed bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);

        // Decrement enrolled count
        scheduledClassService.decrementEnrolledCount(booking.getClassId());

        // Promote next from waitlist
        WaitlistEntry promoted = waitlistService.getNextInLine(booking.getClassId());
        if (promoted != null) {
            // Auto-book the promoted student
            ScheduledClass sc = scheduledClassRepository.findById(booking.getClassId()).orElse(null);
            if (sc != null) {
                Booking promotedBooking = Booking.builder()
                        .classId(booking.getClassId())
                        .studentUserId(promoted.getStudentUserId())
                        .paidAmount(sc.getPrice())
                        .build();
                bookingRepository.save(promotedBooking);
                scheduledClassService.incrementEnrolledCount(booking.getClassId());

                notificationService.sendWaitlistPromotedNotification(promoted.getStudentUserId(), sc.getTitle());
                logger.info("Promoted user {} from waitlist for class '{}'", promoted.getStudentUserId(), sc.getTitle());
            }
        }

        logger.info("User {} cancelled booking for class {}", userId, booking.getClassId());
        return toResponse(booking);
    }

    private BookingResponse toResponse(Booking booking) {
        String classTitle = scheduledClassRepository.findById(booking.getClassId())
                .map(ScheduledClass::getTitle).orElse("Unknown Class");

        return new BookingResponse(
                booking.getId(), booking.getClassId(), classTitle,
                booking.getStudentUserId(), booking.getStatus().name(),
                booking.getPaidAmount(), booking.getCreatedAt(), booking.getCancelledAt());
    }
}
