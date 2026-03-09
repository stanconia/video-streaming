package com.videostreaming.teacher.repository;

import com.videostreaming.teacher.model.TeacherProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, String> {
    Optional<TeacherProfile> findByUserId(String userId);
    boolean existsByUserId(String userId);

    @Query(value = "SELECT * FROM teacher_profiles tp WHERE " +
           "(CAST(:subject AS text) = '' OR LOWER(tp.subjects) LIKE LOWER(CONCAT('%', CAST(:subject AS text), '%'))) " +
           "AND (CAST(:query AS text) = '' OR LOWER(tp.display_name) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%')) " +
           "OR LOWER(tp.headline) LIKE LOWER(CONCAT('%', CAST(:query AS text), '%')))",
           nativeQuery = true)
    List<TeacherProfile> searchTeachers(@Param("subject") String subject, @Param("query") String query);
}
