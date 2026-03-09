package com.videostreaming.assignment.repository;

import com.videostreaming.assignment.model.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, String> {
    List<Assignment> findByModuleIdOrderByOrderIndexAsc(String moduleId);
    List<Assignment> findByCourseId(String courseId);
    long countByModuleId(String moduleId);
}
