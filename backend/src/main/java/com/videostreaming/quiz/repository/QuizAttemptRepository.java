package com.videostreaming.quiz.repository;

import com.videostreaming.quiz.model.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, String> {
    List<QuizAttempt> findByQuizIdAndStudentUserIdOrderByCompletedAtDesc(String quizId, String studentUserId);
    boolean existsByQuizIdAndStudentUserIdAndPassedTrue(String quizId, String studentUserId);
    List<QuizAttempt> findByCourseIdAndStudentUserId(String courseId, String studentUserId);

    @Query("SELECT AVG(qa.percentage) FROM QuizAttempt qa WHERE qa.courseId = :courseId")
    Double findAveragePercentageByCourseId(@Param("courseId") String courseId);
}
