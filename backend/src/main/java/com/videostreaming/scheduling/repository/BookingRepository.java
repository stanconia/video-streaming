package com.videostreaming.scheduling.repository;

import com.videostreaming.scheduling.model.Booking;
import com.videostreaming.scheduling.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {
    List<Booking> findByStudentUserIdOrderByCreatedAtDesc(String studentUserId);
    List<Booking> findByClassIdAndStatus(String classId, BookingStatus status);
    Optional<Booking> findByClassIdAndStudentUserId(String classId, String studentUserId);
    boolean existsByClassIdAndStudentUserIdAndStatus(String classId, String studentUserId, BookingStatus status);
    long countByClassIdAndStatus(String classId, BookingStatus status);
    List<Booking> findByPayoutStatus(String payoutStatus);
    @Query("SELECT b FROM Booking b JOIN ScheduledClass sc ON b.classId = sc.id WHERE sc.teacherUserId = :teacherUserId AND b.status = :status ORDER BY b.createdAt DESC")
    List<Booking> findByTeacherUserIdAndStatus(@Param("teacherUserId") String teacherUserId, @Param("status") BookingStatus status);
}
