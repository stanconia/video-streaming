package com.videostreaming.payment.repository;

import com.videostreaming.payment.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, String> {
    Optional<Coupon> findByCodeAndActiveTrue(String code);
    List<Coupon> findByTeacherUserIdOrderByCreatedAtDesc(String teacherUserId);
    boolean existsByCode(String code);
}
