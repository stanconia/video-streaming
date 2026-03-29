package com.videostreaming.payment.service;

import com.videostreaming.notification.service.NotificationService;
import com.stripe.exception.StripeException;
import com.stripe.model.Refund;
import com.stripe.model.Transfer;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.TransferCreateParams;
import com.videostreaming.course.model.Course;
import com.videostreaming.course.model.CourseEnrollment;
import com.videostreaming.course.repository.CourseEnrollmentRepository;
import com.videostreaming.course.repository.CourseRepository;
import com.videostreaming.scheduling.model.Booking;
import com.videostreaming.scheduling.model.BookingStatus;
import com.videostreaming.scheduling.model.ScheduledClass;
import com.videostreaming.teacher.model.TeacherProfile;
import com.videostreaming.payment.dto.RefundResponse;
import com.videostreaming.scheduling.repository.BookingRepository;
import com.videostreaming.scheduling.repository.ScheduledClassRepository;
import com.videostreaming.teacher.repository.TeacherProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EscrowPaymentService {

    private static final Logger logger = LoggerFactory.getLogger(EscrowPaymentService.class);
    private static final double PLATFORM_FEE_RATE = 0.15;

    private final BookingRepository bookingRepository;
    private final ScheduledClassRepository scheduledClassRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final NotificationService notificationService;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final CourseRepository courseRepository;

    public EscrowPaymentService(BookingRepository bookingRepository,
                                 ScheduledClassRepository scheduledClassRepository,
                                 TeacherProfileRepository teacherProfileRepository,
                                 NotificationService notificationService,
                                 CourseEnrollmentRepository courseEnrollmentRepository,
                                 CourseRepository courseRepository) {
        this.bookingRepository = bookingRepository;
        this.scheduledClassRepository = scheduledClassRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.notificationService = notificationService;
        this.courseEnrollmentRepository = courseEnrollmentRepository;
        this.courseRepository = courseRepository;
    }

    @Transactional
    public void capturePaymentWithEscrow(String paymentIntentId) {
        bookingRepository.findAll().stream()
                .filter(b -> paymentIntentId.equals(b.getPaymentIntentId()))
                .findFirst()
                .ifPresent(booking -> {
                    double fee = Math.round(booking.getPaidAmount() * PLATFORM_FEE_RATE * 100.0) / 100.0;
                    double payout = booking.getPaidAmount() - fee;
                    booking.setPlatformFee(fee);
                    booking.setTeacherPayout(payout);
                    booking.setPayoutStatus("HELD");
                    bookingRepository.save(booking);
                    logger.info("Payment held in escrow for booking {}: total={}, fee={}, payout={}",
                            booking.getId(), booking.getPaidAmount(), fee, payout);
                });
    }

    @Transactional
    public void releasePayment(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!"HELD".equals(booking.getPayoutStatus())) {
            logger.warn("Booking {} payout status is {}, not HELD. Skipping.", bookingId, booking.getPayoutStatus());
            return;
        }

        ScheduledClass sc = scheduledClassRepository.findById(booking.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));
        TeacherProfile teacher = teacherProfileRepository.findByUserId(sc.getTeacherUserId()).orElse(null);

        if (teacher != null && teacher.getStripeAccountId() != null && teacher.isStripeOnboarded()) {
            try {
                long payoutCents = Math.round(booking.getTeacherPayout() * 100);
                TransferCreateParams params = TransferCreateParams.builder()
                        .setAmount(payoutCents)
                        .setCurrency("usd")
                        .setDestination(teacher.getStripeAccountId())
                        .putMetadata("bookingId", bookingId)
                        .build();
                Transfer transfer = Transfer.create(params);
                booking.setStripeTransferId(transfer.getId());
                booking.setPayoutStatus("COMPLETED");
                teacher.setTotalEarnings(teacher.getTotalEarnings() + booking.getTeacherPayout());
                teacherProfileRepository.save(teacher);
                logger.info("Released payout {} to teacher {} for booking {}", transfer.getId(), sc.getTeacherUserId(), bookingId);
                notificationService.sendPaymentReleasedNotification(sc.getTeacherUserId(), booking.getTeacherPayout(), sc.getTitle());
            } catch (StripeException e) {
                booking.setPayoutStatus("FAILED");
                logger.error("Stripe transfer failed for booking {}: {}", bookingId, e.getMessage());
            }
        } else {
            booking.setPayoutStatus("PENDING");
            logger.info("Teacher {} not onboarded to Stripe, payout pending for booking {}", sc.getTeacherUserId(), bookingId);
        }
        bookingRepository.save(booking);
    }

    @Transactional
    public void processClassCompletionPayouts(String classId) {
        List<Booking> heldBookings = bookingRepository.findByClassIdAndStatus(classId, BookingStatus.CONFIRMED);
        for (Booking booking : heldBookings) {
            if ("HELD".equals(booking.getPayoutStatus())) {
                releasePayment(booking.getId());
            }
        }
        logger.info("Processed {} payout(s) for completed class {}", heldBookings.size(), classId);
    }

    @Transactional
    public RefundResponse processRefund(String bookingId, String userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getStudentUserId().equals(userId)) {
            throw new RuntimeException("You can only refund your own bookings");
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new RuntimeException("Booking is not in a refundable state");
        }

        ScheduledClass sc = scheduledClassRepository.findById(booking.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));
        if (sc.getScheduledAt().isBefore(LocalDateTime.now().plusHours(24))) {
            throw new RuntimeException("Refunds are only available more than 24 hours before class start");
        }

        if (booking.getPaymentIntentId() != null) {
            try {
                RefundCreateParams params = RefundCreateParams.builder()
                        .setPaymentIntent(booking.getPaymentIntentId())
                        .build();
                Refund.create(params);
                logger.info("Stripe refund created for booking {}", bookingId);
            } catch (StripeException e) {
                logger.error("Stripe refund failed for booking {}: {}", bookingId, e.getMessage());
                throw new RuntimeException("Refund processing failed: " + e.getMessage());
            }
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setPayoutStatus("REFUNDED");
        booking.setCancelledAt(LocalDateTime.now());
        booking.setRefundedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        return new RefundResponse(bookingId, booking.getPaidAmount(), "REFUNDED", booking.getRefundedAt());
    }

    @Transactional
    public void releaseCoursePayment(String enrollmentId) {
        CourseEnrollment enrollment = courseEnrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        if (!"HELD".equals(enrollment.getPayoutStatus())) {
            logger.warn("Enrollment {} payout status is {}, not HELD", enrollmentId, enrollment.getPayoutStatus());
            return;
        }

        Course course = courseRepository.findById(enrollment.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        TeacherProfile teacher = teacherProfileRepository.findByUserId(course.getTeacherUserId()).orElse(null);

        if (teacher != null && teacher.getStripeAccountId() != null && teacher.isStripeOnboarded()) {
            try {
                long payoutCents = enrollment.getTeacherPayout().longValue();
                TransferCreateParams params = TransferCreateParams.builder()
                        .setAmount(payoutCents)
                        .setCurrency("usd")
                        .setDestination(teacher.getStripeAccountId())
                        .putMetadata("enrollmentId", enrollmentId)
                        .putMetadata("courseId", enrollment.getCourseId())
                        .build();
                Transfer transfer = Transfer.create(params);
                enrollment.setStripeTransferId(transfer.getId());
                enrollment.setPayoutStatus("COMPLETED");
                teacher.setTotalEarnings(teacher.getTotalEarnings() + enrollment.getTeacherPayout().doubleValue());
                teacherProfileRepository.save(teacher);
                courseEnrollmentRepository.save(enrollment);
                logger.info("Released course payout {} to teacher {} for enrollment {}",
                        transfer.getId(), course.getTeacherUserId(), enrollmentId);
                notificationService.sendPaymentReleasedNotification(
                        course.getTeacherUserId(), enrollment.getTeacherPayout().doubleValue(), course.getTitle());
            } catch (StripeException e) {
                enrollment.setPayoutStatus("FAILED");
                courseEnrollmentRepository.save(enrollment);
                logger.error("Stripe transfer failed for enrollment {}: {}", enrollmentId, e.getMessage());
            }
        } else {
            enrollment.setPayoutStatus("PENDING");
            courseEnrollmentRepository.save(enrollment);
            logger.info("Teacher {} not onboarded, course payout pending", course.getTeacherUserId());
        }
    }
}
