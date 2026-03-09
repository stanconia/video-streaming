package com.videostreaming.payment.repository;

import com.videostreaming.payment.model.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, String> {
    boolean existsByCouponIdAndStudentUserId(String couponId, String studentUserId);
    long countByCouponId(String couponId);
}
