package com.videostreaming.scheduling.service;

import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.scheduling.dto.BookingResponse;
import com.videostreaming.scheduling.dto.CreateBookingRequest;
import com.videostreaming.scheduling.model.*;
import com.videostreaming.scheduling.repository.BookingRepository;
import com.videostreaming.scheduling.repository.ScheduledClassRepository;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import com.videostreaming.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private ScheduledClassRepository scheduledClassRepository;
    @Mock private ScheduledClassService scheduledClassService;
    @Mock private WaitlistService waitlistService;
    @Mock private NotificationService notificationService;
    @Mock private UserRepository userRepository;

    @InjectMocks private BookingService service;

    @Test
    void bookClass_success() {
        String studentUserId = "student-1";
        String classId = "class-1";

        ScheduledClass sc = ScheduledClass.builder()
                .id(classId)
                .teacherUserId("teacher-1")
                .title("Math Class")
                .subject("Math")
                .scheduledAt(LocalDateTime.now().plusDays(1))
                .durationMinutes(60)
                .maxStudents(10)
                .enrolledStudents(3)
                .price(29.99)
                .currency("USD")
                .status(ClassStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build();

        CreateBookingRequest request = new CreateBookingRequest(classId, "pi_test123");

        Booking savedBooking = Booking.builder()
                .id("booking-1")
                .classId(classId)
                .studentUserId(studentUserId)
                .status(BookingStatus.CONFIRMED)
                .paidAmount(29.99)
                .paymentIntentId("pi_test123")
                .createdAt(LocalDateTime.now())
                .build();

        User student = User.builder()
                .id(studentUserId)
                .displayName("Jane Student")
                .email("jane@test.com")
                .role(UserRole.STUDENT)
                .build();

        when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sc));
        when(bookingRepository.existsByClassIdAndStudentUserIdAndStatus(
                classId, studentUserId, BookingStatus.CONFIRMED)).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);
        when(userRepository.findById(studentUserId)).thenReturn(Optional.of(student));

        BookingResponse result = service.bookClass(studentUserId, request);

        assertNotNull(result);
        assertEquals("booking-1", result.getId());
        assertEquals(classId, result.getClassId());
        assertEquals(29.99, result.getPaidAmount(), 0.01);
        verify(scheduledClassService).incrementEnrolledCount(classId);
        verify(notificationService).sendClassBookedNotification(
                eq("teacher-1"), eq("Jane Student"), eq("Math Class"));
    }

    @Test
    void bookClass_classFull_throws() {
        String studentUserId = "student-1";
        String classId = "class-1";

        ScheduledClass sc = ScheduledClass.builder()
                .id(classId)
                .teacherUserId("teacher-1")
                .title("Math Class")
                .subject("Math")
                .scheduledAt(LocalDateTime.now().plusDays(1))
                .durationMinutes(60)
                .maxStudents(10)
                .enrolledStudents(10)
                .price(29.99)
                .currency("USD")
                .status(ClassStatus.FULL)
                .createdAt(LocalDateTime.now())
                .build();

        CreateBookingRequest request = new CreateBookingRequest(classId, "pi_test123");

        when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sc));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                service.bookClass(studentUserId, request));

        assertTrue(exception.getMessage().contains("not available for booking"));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void cancelBooking_success() {
        String bookingId = "booking-1";
        String userId = "student-1";
        String classId = "class-1";

        Booking booking = Booking.builder()
                .id(bookingId)
                .classId(classId)
                .studentUserId(userId)
                .status(BookingStatus.CONFIRMED)
                .paidAmount(29.99)
                .createdAt(LocalDateTime.now())
                .build();

        ScheduledClass sc = ScheduledClass.builder()
                .id(classId)
                .teacherUserId("teacher-1")
                .title("Math Class")
                .subject("Math")
                .scheduledAt(LocalDateTime.now().plusDays(1))
                .durationMinutes(60)
                .maxStudents(10)
                .price(29.99)
                .currency("USD")
                .status(ClassStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build();

        Booking cancelledBooking = Booking.builder()
                .id(bookingId)
                .classId(classId)
                .studentUserId(userId)
                .status(BookingStatus.CANCELLED)
                .paidAmount(29.99)
                .createdAt(LocalDateTime.now())
                .cancelledAt(LocalDateTime.now())
                .build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(cancelledBooking);
        when(waitlistService.getNextInLine(classId)).thenReturn(null);
        when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sc));

        BookingResponse result = service.cancelBooking(bookingId, userId);

        assertNotNull(result);
        assertEquals("CANCELLED", result.getStatus());
        verify(scheduledClassService).decrementEnrolledCount(classId);
    }

    @Test
    void getMyBookings_returnsList() {
        String studentUserId = "student-1";

        Booking b1 = Booking.builder()
                .id("booking-1")
                .classId("class-1")
                .studentUserId(studentUserId)
                .status(BookingStatus.CONFIRMED)
                .paidAmount(29.99)
                .createdAt(LocalDateTime.now())
                .build();

        Booking b2 = Booking.builder()
                .id("booking-2")
                .classId("class-2")
                .studentUserId(studentUserId)
                .status(BookingStatus.CONFIRMED)
                .paidAmount(19.99)
                .createdAt(LocalDateTime.now())
                .build();

        ScheduledClass sc1 = ScheduledClass.builder()
                .id("class-1")
                .title("Math Class")
                .teacherUserId("teacher-1")
                .subject("Math")
                .scheduledAt(LocalDateTime.now())
                .durationMinutes(60)
                .maxStudents(10)
                .price(29.99)
                .currency("USD")
                .status(ClassStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build();

        ScheduledClass sc2 = ScheduledClass.builder()
                .id("class-2")
                .title("Science Class")
                .teacherUserId("teacher-2")
                .subject("Science")
                .scheduledAt(LocalDateTime.now())
                .durationMinutes(60)
                .maxStudents(10)
                .price(19.99)
                .currency("USD")
                .status(ClassStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build();

        when(bookingRepository.findByStudentUserIdOrderByCreatedAtDesc(studentUserId))
                .thenReturn(List.of(b1, b2));
        when(scheduledClassRepository.findById("class-1")).thenReturn(Optional.of(sc1));
        when(scheduledClassRepository.findById("class-2")).thenReturn(Optional.of(sc2));

        List<BookingResponse> result = service.getMyBookings(studentUserId);

        assertEquals(2, result.size());
        assertEquals("booking-1", result.get(0).getId());
        assertEquals("booking-2", result.get(1).getId());
    }

    @Test
    void getBookingsForClass_teacherCannotBookOwnClass() {
        String teacherUserId = "teacher-1";
        String classId = "class-1";

        ScheduledClass sc = ScheduledClass.builder()
                .id(classId)
                .teacherUserId(teacherUserId)
                .title("Math Class")
                .subject("Math")
                .scheduledAt(LocalDateTime.now().plusDays(1))
                .durationMinutes(60)
                .maxStudents(10)
                .enrolledStudents(3)
                .price(29.99)
                .currency("USD")
                .status(ClassStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build();

        CreateBookingRequest request = new CreateBookingRequest(classId, "pi_test123");

        when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sc));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                service.bookClass(teacherUserId, request));

        assertTrue(exception.getMessage().contains("Teachers cannot book their own classes"));
    }
}
