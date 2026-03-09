package com.videostreaming.review.repository;

import com.videostreaming.review.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByTeacherUserIdOrderByCreatedAtDesc(String teacherUserId);
    boolean existsByStudentUserIdAndClassId(String studentUserId, String classId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.teacherUserId = :teacherUserId")
    Double findAverageRatingByTeacherUserId(@Param("teacherUserId") String teacherUserId);

    long countByTeacherUserId(String teacherUserId);
}
