package com.videostreaming.scheduling.repository;

import com.videostreaming.scheduling.model.ClassStatus;
import com.videostreaming.scheduling.model.ScheduledClass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScheduledClassRepository extends JpaRepository<ScheduledClass, String> {
    List<ScheduledClass> findByStatusInOrderByScheduledAtAsc(List<ClassStatus> statuses);
    List<ScheduledClass> findBySubjectAndStatusInOrderByScheduledAtAsc(String subject, List<ClassStatus> statuses);
    List<ScheduledClass> findByTeacherUserIdOrderByScheduledAtDesc(String teacherUserId);
    List<ScheduledClass> findByCourseIdAndStatusIn(String courseId, List<ClassStatus> statuses);

    @Query(value = "SELECT * FROM scheduled_classes sc WHERE CAST(sc.status AS text) IN (:statuses) " +
           "AND (CAST(:subject AS text) = '' OR sc.subject = CAST(:subject AS text)) " +
           "AND (CAST(:query AS text) = '' OR LOWER(sc.title) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%')) " +
           "OR LOWER(sc.description) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%'))) " +
           "AND (CAST(:minPrice AS double precision) IS NULL OR sc.price >= CAST(:minPrice AS double precision)) " +
           "AND (CAST(:maxPrice AS double precision) IS NULL OR sc.price <= CAST(:maxPrice AS double precision)) " +
           "AND (CAST(:dateFrom AS timestamp) IS NULL OR sc.scheduled_at >= CAST(:dateFrom AS timestamp)) " +
           "AND (CAST(:dateTo AS timestamp) IS NULL OR sc.scheduled_at <= CAST(:dateTo AS timestamp))",
           countQuery = "SELECT COUNT(*) FROM scheduled_classes sc WHERE CAST(sc.status AS text) IN (:statuses) " +
           "AND (CAST(:subject AS text) = '' OR sc.subject = CAST(:subject AS text)) " +
           "AND (CAST(:query AS text) = '' OR LOWER(sc.title) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%')) " +
           "OR LOWER(sc.description) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%'))) " +
           "AND (CAST(:minPrice AS double precision) IS NULL OR sc.price >= CAST(:minPrice AS double precision)) " +
           "AND (CAST(:maxPrice AS double precision) IS NULL OR sc.price <= CAST(:maxPrice AS double precision)) " +
           "AND (CAST(:dateFrom AS timestamp) IS NULL OR sc.scheduled_at >= CAST(:dateFrom AS timestamp)) " +
           "AND (CAST(:dateTo AS timestamp) IS NULL OR sc.scheduled_at <= CAST(:dateTo AS timestamp))",
           nativeQuery = true)
    Page<ScheduledClass> searchClasses(
            @Param("statuses") List<String> statuses,
            @Param("subject") String subject,
            @Param("query") String query,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo,
            Pageable pageable);
}
