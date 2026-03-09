package com.videostreaming.quiz.repository;

import com.videostreaming.quiz.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, String> {
    List<Quiz> findByModuleIdOrderByOrderIndexAsc(String moduleId);
    List<Quiz> findByCourseId(String courseId);
    long countByModuleId(String moduleId);
}
