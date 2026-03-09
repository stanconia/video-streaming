package com.videostreaming.course.repository;

import com.videostreaming.course.model.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {
    List<Course> findByTeacherUserIdOrderByCreatedAtDesc(String teacherUserId);
    List<Course> findByPublishedTrueOrderByCreatedAtDesc();
    List<Course> findBySubjectAndPublishedTrueOrderByCreatedAtDesc(String subject);
    long countByTeacherUserId(String teacherUserId);

    @Query("SELECT DISTINCT c.subject FROM Course c WHERE c.published = true AND c.subject IS NOT NULL ORDER BY c.subject")
    List<String> findAllDistinctSubjects();

    @Query(value = "SELECT c.* FROM courses c " +
           "LEFT JOIN users u ON c.teacher_user_id = u.id " +
           "WHERE c.published = true " +
           "AND (CAST(:query AS text) = '' OR " +
           "     LOWER(c.title) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%')) OR " +
           "     LOWER(c.description) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%')) OR " +
           "     LOWER(c.subject) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%')) OR " +
           "     LOWER(c.tags) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%')) OR " +
           "     LOWER(u.display_name) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%'))) " +
           "AND (CAST(:subject AS text) = '' OR c.subject = CAST(:subject AS text)) " +
           "AND (CAST(:difficulty AS text) = '' OR CAST(c.difficulty_level AS text) = CAST(:difficulty AS text)) " +
           "AND (CAST(:minPrice AS numeric) IS NULL OR c.price >= CAST(:minPrice AS numeric)) " +
           "AND (CAST(:maxPrice AS numeric) IS NULL OR c.price <= CAST(:maxPrice AS numeric))",
           countQuery = "SELECT COUNT(*) FROM courses c " +
           "LEFT JOIN users u ON c.teacher_user_id = u.id " +
           "WHERE c.published = true " +
           "AND (CAST(:query AS text) = '' OR " +
           "     LOWER(c.title) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%')) OR " +
           "     LOWER(c.description) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%')) OR " +
           "     LOWER(c.subject) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%')) OR " +
           "     LOWER(c.tags) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%')) OR " +
           "     LOWER(u.display_name) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%'))) " +
           "AND (CAST(:subject AS text) = '' OR c.subject = CAST(:subject AS text)) " +
           "AND (CAST(:difficulty AS text) = '' OR CAST(c.difficulty_level AS text) = CAST(:difficulty AS text)) " +
           "AND (CAST(:minPrice AS numeric) IS NULL OR c.price >= CAST(:minPrice AS numeric)) " +
           "AND (CAST(:maxPrice AS numeric) IS NULL OR c.price <= CAST(:maxPrice AS numeric))",
           nativeQuery = true)
    Page<Course> searchCourses(
            @Param("query") String query,
            @Param("subject") String subject,
            @Param("difficulty") String difficulty,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);
}
