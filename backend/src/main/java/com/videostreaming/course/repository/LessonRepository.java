package com.videostreaming.course.repository;

import com.videostreaming.course.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, String> {
    List<Lesson> findByModuleIdOrderByOrderIndexAsc(String moduleId);
    List<Lesson> findByCourseId(String courseId);
    long countByModuleId(String moduleId);
    long countByCourseId(String courseId);
    void deleteByModuleId(String moduleId);
    void deleteByCourseId(String courseId);
}
