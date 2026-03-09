package com.videostreaming.course.repository;

import com.videostreaming.course.model.CourseModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseModuleRepository extends JpaRepository<CourseModule, String> {
    List<CourseModule> findByCourseIdOrderByOrderIndexAsc(String courseId);
    long countByCourseId(String courseId);
    void deleteByCourseId(String courseId);
}
