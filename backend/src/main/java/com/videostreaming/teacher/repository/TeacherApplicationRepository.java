package com.videostreaming.teacher.repository;

import com.videostreaming.teacher.model.ApplicationStatus;
import com.videostreaming.teacher.model.TeacherApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherApplicationRepository extends JpaRepository<TeacherApplication, String> {
    List<TeacherApplication> findByStatusOrderBySubmittedAtDesc(ApplicationStatus status);
    List<TeacherApplication> findAllByOrderBySubmittedAtDesc();
    Optional<TeacherApplication> findByUserIdAndStatus(String userId, ApplicationStatus status);
    boolean existsByUserIdAndStatusIn(String userId, List<ApplicationStatus> statuses);
    long countByStatus(ApplicationStatus status);
}
