package com.videostreaming.payment.controller;

import com.videostreaming.payment.dto.CouponResponse;
import com.videostreaming.payment.dto.CreateCouponRequest;
import com.videostreaming.payment.service.CouponService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping
    public ResponseEntity<?> createCoupon(@RequestBody CreateCouponRequest request,
                                           Authentication authentication) {
        try {
            String teacherUserId = (String) authentication.getPrincipal();
            CouponResponse response = couponService.createCoupon(teacherUserId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<CouponResponse>> getTeacherCoupons(Authentication authentication) {
        String teacherUserId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(couponService.getTeacherCoupons(teacherUserId));
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateCoupon(@RequestParam String code,
                                             @RequestParam String classId) {
        try {
            CouponResponse response = couponService.validateCoupon(code, classId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/apply")
    public ResponseEntity<?> applyCoupon(@RequestBody Map<String, String> request,
                                          Authentication authentication) {
        try {
            String studentUserId = (String) authentication.getPrincipal();
            String code = request.get("code");
            String bookingId = request.get("bookingId");
            Map<String, Object> result = couponService.applyCoupon(code, studentUserId, bookingId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
