package com.videostreaming.payment.controller;

import com.videostreaming.course.model.Course;
import com.videostreaming.course.model.CourseEnrollment;
import com.videostreaming.course.repository.CourseEnrollmentRepository;
import com.videostreaming.course.repository.CourseRepository;
import com.videostreaming.payment.service.EscrowPaymentService;
import com.videostreaming.scheduling.model.Booking;
import com.videostreaming.scheduling.model.BookingStatus;
import com.videostreaming.scheduling.model.ScheduledClass;
import com.videostreaming.payment.dto.PayoutSummaryResponse;
import com.videostreaming.teacher.dto.TeacherEarningsResponse;
import com.videostreaming.scheduling.repository.BookingRepository;
import com.videostreaming.scheduling.repository.ScheduledClassRepository;
import com.videostreaming.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payouts")
public class PayoutController {

    private final BookingRepository bookingRepository;
    private final ScheduledClassRepository scheduledClassRepository;
    private final UserRepository userRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final CourseRepository courseRepository;
    private final EscrowPaymentService escrowPaymentService;

    public PayoutController(BookingRepository bookingRepository,
                             ScheduledClassRepository scheduledClassRepository,
                             UserRepository userRepository,
                             CourseEnrollmentRepository courseEnrollmentRepository,
                             CourseRepository courseRepository,
                             EscrowPaymentService escrowPaymentService) {
        this.bookingRepository = bookingRepository;
        this.scheduledClassRepository = scheduledClassRepository;
        this.userRepository = userRepository;
        this.courseEnrollmentRepository = courseEnrollmentRepository;
        this.courseRepository = courseRepository;
        this.escrowPaymentService = escrowPaymentService;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            List<Booking> bookings = bookingRepository.findByTeacherUserIdAndStatus(userId, BookingStatus.CONFIRMED);

            double totalEarnings = bookings.stream().mapToDouble(Booking::getTeacherPayout).sum();
            double pendingPayouts = bookings.stream()
                    .filter(b -> "HELD".equals(b.getPayoutStatus()) || "PENDING".equals(b.getPayoutStatus()))
                    .mapToDouble(Booking::getTeacherPayout).sum();
            double completedPayouts = bookings.stream()
                    .filter(b -> "COMPLETED".equals(b.getPayoutStatus()))
                    .mapToDouble(Booking::getTeacherPayout).sum();
            int payoutCount = (int) bookings.stream()
                    .filter(b -> "COMPLETED".equals(b.getPayoutStatus())).count();

            // Include course enrollment earnings
            List<CourseEnrollment> courseEnrollments = courseEnrollmentRepository
                    .findPaidEnrollmentsByTeacherUserId(userId);
            for (CourseEnrollment ce : courseEnrollments) {
                if (ce.getTeacherPayout() != null) {
                    double tp = ce.getTeacherPayout().doubleValue();
                    totalEarnings += tp;
                    if ("HELD".equals(ce.getPayoutStatus()) || "PENDING".equals(ce.getPayoutStatus())) {
                        pendingPayouts += tp;
                    } else if ("COMPLETED".equals(ce.getPayoutStatus())) {
                        completedPayouts += tp;
                        payoutCount++;
                    }
                }
            }

            return ResponseEntity.ok(new PayoutSummaryResponse(totalEarnings, pendingPayouts, completedPayouts, payoutCount));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            List<Booking> bookings = bookingRepository.findByTeacherUserIdAndStatus(userId, BookingStatus.CONFIRMED);

            List<TeacherEarningsResponse> earnings = new ArrayList<>();
            for (Booking b : bookings) {
                String classTitle = scheduledClassRepository.findById(b.getClassId())
                        .map(ScheduledClass::getTitle).orElse("Unknown Class");
                String studentName = userRepository.findById(b.getStudentUserId())
                        .map(u -> u.getDisplayName()).orElse("Unknown Student");
                TeacherEarningsResponse resp = new TeacherEarningsResponse(
                        b.getClassId(), classTitle, studentName,
                        b.getPaidAmount(), b.getPlatformFee(), b.getTeacherPayout(),
                        b.getPayoutStatus() != null ? b.getPayoutStatus() : "N/A",
                        b.getCreatedAt().toString());
                resp.setId(b.getId());
                resp.setType("booking");
                earnings.add(resp);
            }

            // Include course enrollment earnings
            List<CourseEnrollment> courseEnrollments = courseEnrollmentRepository
                    .findPaidEnrollmentsByTeacherUserId(userId);
            for (CourseEnrollment ce : courseEnrollments) {
                if (ce.getTeacherPayout() != null) {
                    String courseTitle = courseRepository.findById(ce.getCourseId())
                            .map(Course::getTitle).orElse("Unknown Course");
                    String studentName = userRepository.findById(ce.getStudentUserId())
                            .map(u -> u.getDisplayName()).orElse("Unknown Student");
                    double amount = ce.getPaidAmount() != null ? ce.getPaidAmount().doubleValue() : 0;
                    double fee = ce.getPlatformFee() != null ? ce.getPlatformFee().doubleValue() : 0;
                    double payout = ce.getTeacherPayout().doubleValue();
                    TeacherEarningsResponse resp = new TeacherEarningsResponse(
                            ce.getCourseId(), courseTitle, studentName,
                            amount, fee, payout,
                            ce.getPayoutStatus() != null ? ce.getPayoutStatus() : "N/A",
                            ce.getEnrolledAt().toString());
                    resp.setId(ce.getId());
                    resp.setType("course");
                    earnings.add(resp);
                }
            }

            return ResponseEntity.ok(earnings);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/request-payout")
    public ResponseEntity<?> requestPayout(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            String bookingId = request.get("bookingId");
            String enrollmentId = request.get("enrollmentId");

            if (bookingId != null) {
                Booking booking = bookingRepository.findById(bookingId)
                        .orElseThrow(() -> new RuntimeException("Booking not found"));
                ScheduledClass sc = scheduledClassRepository.findById(booking.getClassId())
                        .orElseThrow(() -> new RuntimeException("Class not found"));
                if (!sc.getTeacherUserId().equals(userId)) {
                    throw new RuntimeException("Not authorized");
                }
                escrowPaymentService.releasePayment(bookingId);
                return ResponseEntity.ok(Map.of("message", "Payout released"));
            } else if (enrollmentId != null) {
                CourseEnrollment enrollment = courseEnrollmentRepository.findById(enrollmentId)
                        .orElseThrow(() -> new RuntimeException("Enrollment not found"));
                Course course = courseRepository.findById(enrollment.getCourseId())
                        .orElseThrow(() -> new RuntimeException("Course not found"));
                if (!course.getTeacherUserId().equals(userId)) {
                    throw new RuntimeException("Not authorized");
                }
                escrowPaymentService.releaseCoursePayment(enrollmentId);
                return ResponseEntity.ok(Map.of("message", "Payout released"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "bookingId or enrollmentId required"));
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
