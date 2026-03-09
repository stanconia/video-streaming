package com.videostreaming.course.repository;

import com.videostreaming.course.model.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, String> {
    List<LessonProgress> findByStudentUserIdAndCourseId(String studentUserId, String courseId);
    Optional<LessonProgress> findByLessonIdAndStudentUserId(String lessonId, String studentUserId);
    long countByStudentUserIdAndCourseIdAndCompletedTrue(String studentUserId, String courseId);
}
