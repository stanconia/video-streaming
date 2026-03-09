package com.videostreaming.course.repository;

import com.videostreaming.course.model.CourseEnrollment;
import com.videostreaming.course.model.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, String> {
    List<CourseEnrollment> findByStudentUserIdOrderByEnrolledAtDesc(String studentUserId);
    Optional<CourseEnrollment> findByCourseIdAndStudentUserId(String courseId, String studentUserId);
    boolean existsByCourseIdAndStudentUserIdAndStatus(String courseId, String studentUserId, EnrollmentStatus status);
    long countByCourseIdAndStatus(String courseId, EnrollmentStatus status);
    long countByStudentUserIdAndStatus(String studentUserId, EnrollmentStatus status);
    long countByStatus(EnrollmentStatus status);
    List<CourseEnrollment> findByCourseIdAndStatusIn(String courseId, List<EnrollmentStatus> statuses);
    List<CourseEnrollment> findByCourseIdOrderByEnrolledAtDesc(String courseId);

    @Query("SELECT COALESCE(SUM(e.paidAmount), 0) FROM CourseEnrollment e WHERE e.status IN ('ACTIVE','COMPLETED')")
    BigDecimal sumTotalRevenue();

    @Query("SELECT COALESCE(SUM(e.paidAmount), 0) FROM CourseEnrollment e WHERE e.courseId IN :courseIds AND e.status IN ('ACTIVE','COMPLETED')")
    BigDecimal sumPaidAmountByCourseIdIn(@Param("courseIds") List<String> courseIds);

    @Query("SELECT COALESCE(SUM(e.paidAmount), 0) FROM CourseEnrollment e WHERE e.studentUserId = :studentUserId AND e.status IN ('ACTIVE','COMPLETED')")
    BigDecimal sumPaidAmountByStudentUserId(@Param("studentUserId") String studentUserId);

    @Query("SELECT e FROM CourseEnrollment e WHERE e.courseId IN :courseIds AND e.status IN ('ACTIVE','COMPLETED') AND e.paidAmount IS NOT NULL ORDER BY e.enrolledAt ASC")
    List<CourseEnrollment> findPaidEnrollmentsByCourseIds(@Param("courseIds") List<String> courseIds);

    void deleteByCourseId(String courseId);
}
