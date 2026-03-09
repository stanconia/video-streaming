package com.videostreaming.quiz.repository;

import com.videostreaming.quiz.model.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, String> {
    List<QuizQuestion> findByQuizIdOrderByOrderIndexAsc(String quizId);
    long countByQuizId(String quizId);
    void deleteByQuizId(String quizId);
}
