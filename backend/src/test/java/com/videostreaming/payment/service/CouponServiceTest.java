package com.videostreaming.payment.service;

import com.videostreaming.payment.dto.CouponResponse;
import com.videostreaming.payment.dto.CreateCouponRequest;
import com.videostreaming.payment.model.Coupon;
import com.videostreaming.payment.model.CouponUsage;
import com.videostreaming.payment.repository.CouponRepository;
import com.videostreaming.payment.repository.CouponUsageRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock private CouponRepository couponRepository;
    @Mock private CouponUsageRepository couponUsageRepository;

    @InjectMocks private CouponService service;

    @Test
    void createCoupon_success() {
        String teacherUserId = "teacher-1";

        CreateCouponRequest request = new CreateCouponRequest(
                "SAVE20", 20, null, 100, null, null);

        Coupon savedCoupon = Coupon.builder()
                .id("coupon-1")
                .code("SAVE20")
                .teacherUserId(teacherUserId)
                .discountPercent(20)
                .maxUses(100)
                .usedCount(0)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(couponRepository.existsByCode("SAVE20")).thenReturn(false);
        when(couponRepository.save(any(Coupon.class))).thenReturn(savedCoupon);

        CouponResponse result = service.createCoupon(teacherUserId, request);

        assertNotNull(result);
        assertEquals("coupon-1", result.getId());
        assertEquals("SAVE20", result.getCode());
        assertEquals(20, result.getDiscountPercent());
        assertTrue(result.isActive());
        verify(couponRepository).save(any(Coupon.class));
    }

    @Test
    void applyCoupon_valid_returnsDiscount() {
        String code = "SAVE20";
        String studentUserId = "student-1";
        String bookingId = "booking-1";

        Coupon coupon = Coupon.builder()
                .id("coupon-1")
                .code("SAVE20")
                .teacherUserId("teacher-1")
                .discountPercent(20)
                .maxUses(100)
                .usedCount(5)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(couponRepository.findByCodeAndActiveTrue("SAVE20")).thenReturn(Optional.of(coupon));
        when(couponUsageRepository.existsByCouponIdAndStudentUserId("coupon-1", studentUserId))
                .thenReturn(false);
        when(couponRepository.save(any(Coupon.class))).thenReturn(coupon);
        when(couponUsageRepository.save(any(CouponUsage.class)))
                .thenReturn(CouponUsage.builder()
                        .id("usage-1")
                        .couponId("coupon-1")
                        .studentUserId(studentUserId)
                        .bookingId(bookingId)
                        .build());

        Map<String, Object> result = service.applyCoupon(code, studentUserId, bookingId);

        assertNotNull(result);
        assertEquals("coupon-1", result.get("couponId"));
        assertEquals("SAVE20", result.get("code"));
        assertEquals(20, result.get("discountPercent"));
        verify(couponRepository).save(any(Coupon.class));
        verify(couponUsageRepository).save(any(CouponUsage.class));
    }

    @Test
    void applyCoupon_expired_throws() {
        String code = "EXPIRED";
        String studentUserId = "student-1";
        String bookingId = "booking-1";

        Coupon coupon = Coupon.builder()
                .id("coupon-2")
                .code("EXPIRED")
                .teacherUserId("teacher-1")
                .discountPercent(10)
                .maxUses(100)
                .usedCount(0)
                .validUntil(LocalDateTime.now().minusDays(1)) // expired yesterday
                .active(true)
                .createdAt(LocalDateTime.now().minusMonths(1))
                .build();

        when(couponRepository.findByCodeAndActiveTrue("EXPIRED")).thenReturn(Optional.of(coupon));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                service.applyCoupon(code, studentUserId, bookingId));

        assertTrue(exception.getMessage().contains("expired"));
        verify(couponUsageRepository, never()).save(any());
    }

    @Test
    void getTeacherCoupons_returnsList() {
        String teacherUserId = "teacher-1";

        Coupon c1 = Coupon.builder()
                .id("coupon-1")
                .code("SAVE10")
                .teacherUserId(teacherUserId)
                .discountPercent(10)
                .maxUses(50)
                .usedCount(5)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        Coupon c2 = Coupon.builder()
                .id("coupon-2")
                .code("FLAT5")
                .teacherUserId(teacherUserId)
                .discountAmount(BigDecimal.valueOf(5))
                .maxUses(20)
                .usedCount(10)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(couponRepository.findByTeacherUserIdOrderByCreatedAtDesc(teacherUserId))
                .thenReturn(List.of(c1, c2));

        List<CouponResponse> result = service.getTeacherCoupons(teacherUserId);

        assertEquals(2, result.size());
        assertEquals("SAVE10", result.get(0).getCode());
        assertEquals("FLAT5", result.get(1).getCode());
        assertEquals(10, result.get(0).getDiscountPercent());
        assertEquals(BigDecimal.valueOf(5), result.get(1).getDiscountAmount());
    }

    @Test
    void applyCoupon_maxUsesReached_throws() {
        String code = "MAXED";

        Coupon coupon = Coupon.builder()
                .id("coupon-3")
                .code("MAXED")
                .teacherUserId("teacher-1")
                .discountPercent(15)
                .maxUses(10)
                .usedCount(10) // used count equals max uses
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(couponRepository.findByCodeAndActiveTrue("MAXED")).thenReturn(Optional.of(coupon));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                service.applyCoupon(code, "student-1", "booking-1"));

        assertTrue(exception.getMessage().contains("maximum uses"));
    }
}
