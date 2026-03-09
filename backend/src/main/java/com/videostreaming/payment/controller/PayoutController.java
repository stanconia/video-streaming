package com.videostreaming.payment.controller;

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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payouts")
public class PayoutController {

    private final BookingRepository bookingRepository;
    private final ScheduledClassRepository scheduledClassRepository;
    private final UserRepository userRepository;

    public PayoutController(BookingRepository bookingRepository,
                             ScheduledClassRepository scheduledClassRepository,
                             UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.scheduledClassRepository = scheduledClassRepository;
        this.userRepository = userRepository;
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
                earnings.add(new TeacherEarningsResponse(
                        b.getClassId(), classTitle, studentName,
                        b.getPaidAmount(), b.getPlatformFee(), b.getTeacherPayout(),
                        b.getPayoutStatus() != null ? b.getPayoutStatus() : "N/A",
                        b.getCreatedAt().toString()));
            }
            return ResponseEntity.ok(earnings);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
