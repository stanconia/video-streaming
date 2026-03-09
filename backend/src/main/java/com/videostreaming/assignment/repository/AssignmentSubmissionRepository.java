package com.videostreaming.assignment.repository;

import com.videostreaming.assignment.model.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, String> {
    Optional<AssignmentSubmission> findByAssignmentIdAndStudentUserId(String assignmentId, String studentUserId);
    List<AssignmentSubmission> findByAssignmentIdOrderBySubmittedAtDesc(String assignmentId);
    long countByAssignmentId(String assignmentId);
    boolean existsByAssignmentIdAndStudentUserId(String assignmentId, String studentUserId);
    List<AssignmentSubmission> findByCourseIdAndStudentUserId(String courseId, String studentUserId);
}
