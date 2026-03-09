package com.videostreaming.payment.service;

import com.videostreaming.payment.model.Coupon;
import com.videostreaming.payment.model.CouponUsage;
import com.videostreaming.payment.dto.CouponResponse;
import com.videostreaming.payment.dto.CreateCouponRequest;
import com.videostreaming.payment.repository.CouponRepository;
import com.videostreaming.payment.repository.CouponUsageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CouponService {

    private static final Logger logger = LoggerFactory.getLogger(CouponService.class);

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;

    public CouponService(CouponRepository couponRepository, CouponUsageRepository couponUsageRepository) {
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
    }

    @Transactional
    public CouponResponse createCoupon(String teacherUserId, CreateCouponRequest request) {
        if (couponRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Coupon code already exists");
        }

        if (request.getDiscountPercent() != null && (request.getDiscountPercent() < 1 || request.getDiscountPercent() > 100)) {
            throw new RuntimeException("Discount percent must be between 1 and 100");
        }

        LocalDateTime validFrom = request.getValidFrom() != null ? LocalDateTime.parse(request.getValidFrom()) : null;
        LocalDateTime validUntil = request.getValidUntil() != null ? LocalDateTime.parse(request.getValidUntil()) : null;

        Coupon coupon = Coupon.builder()
                .code(request.getCode().toUpperCase())
                .teacherUserId(teacherUserId)
                .discountPercent(request.getDiscountPercent())
                .discountAmount(request.getDiscountAmount())
                .maxUses(request.getMaxUses())
                .validFrom(validFrom)
                .validUntil(validUntil)
                .build();

        coupon = couponRepository.save(coupon);
        logger.info("Coupon {} created by teacher {}", coupon.getCode(), teacherUserId);
        return toResponse(coupon);
    }

    public CouponResponse validateCoupon(String code, String classId) {
        Coupon coupon = couponRepository.findByCodeAndActiveTrue(code.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Coupon not found or inactive"));

        LocalDateTime now = LocalDateTime.now();

        if (coupon.getValidFrom() != null && now.isBefore(coupon.getValidFrom())) {
            throw new RuntimeException("Coupon is not yet valid");
        }

        if (coupon.getValidUntil() != null && now.isAfter(coupon.getValidUntil())) {
            throw new RuntimeException("Coupon has expired");
        }

        if (coupon.getMaxUses() > 0 && coupon.getUsedCount() >= coupon.getMaxUses()) {
            throw new RuntimeException("Coupon has reached maximum uses");
        }

        return toResponse(coupon);
    }

    @Transactional
    public Map<String, Object> applyCoupon(String code, String studentUserId, String bookingId) {
        Coupon coupon = couponRepository.findByCodeAndActiveTrue(code.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Coupon not found or inactive"));

        LocalDateTime now = LocalDateTime.now();

        if (coupon.getValidFrom() != null && now.isBefore(coupon.getValidFrom())) {
            throw new RuntimeException("Coupon is not yet valid");
        }

        if (coupon.getValidUntil() != null && now.isAfter(coupon.getValidUntil())) {
            throw new RuntimeException("Coupon has expired");
        }

        if (coupon.getMaxUses() > 0 && coupon.getUsedCount() >= coupon.getMaxUses()) {
            throw new RuntimeException("Coupon has reached maximum uses");
        }

        if (couponUsageRepository.existsByCouponIdAndStudentUserId(coupon.getId(), studentUserId)) {
            throw new RuntimeException("You have already used this coupon");
        }

        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.save(coupon);

        CouponUsage usage = CouponUsage.builder()
                .couponId(coupon.getId())
                .studentUserId(studentUserId)
                .bookingId(bookingId)
                .build();
        couponUsageRepository.save(usage);

        logger.info("Coupon {} applied by student {} for booking {}", code, studentUserId, bookingId);

        return Map.of(
                "couponId", coupon.getId(),
                "code", coupon.getCode(),
                "discountPercent", coupon.getDiscountPercent() != null ? coupon.getDiscountPercent() : 0,
                "discountAmount", coupon.getDiscountAmount() != null ? coupon.getDiscountAmount() : BigDecimal.ZERO
        );
    }

    public List<CouponResponse> getTeacherCoupons(String teacherUserId) {
        return couponRepository.findByTeacherUserIdOrderByCreatedAtDesc(teacherUserId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public BigDecimal calculateDiscount(Coupon coupon, BigDecimal originalPrice) {
        if (coupon.getDiscountPercent() != null) {
            BigDecimal discountFraction = BigDecimal.valueOf(coupon.getDiscountPercent())
                    .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            BigDecimal discount = originalPrice.multiply(discountFraction);
            return originalPrice.subtract(discount).max(BigDecimal.ZERO);
        }

        if (coupon.getDiscountAmount() != null) {
            return originalPrice.subtract(coupon.getDiscountAmount()).max(BigDecimal.ZERO);
        }

        return originalPrice;
    }

    private CouponResponse toResponse(Coupon coupon) {
        return new CouponResponse(
                coupon.getId(),
                coupon.getCode(),
                coupon.getTeacherUserId(),
                coupon.getDiscountPercent(),
                coupon.getDiscountAmount(),
                coupon.getMaxUses(),
                coupon.getUsedCount(),
                coupon.getValidFrom(),
                coupon.getValidUntil(),
                coupon.isActive(),
                coupon.getCreatedAt()
        );
    }
}
