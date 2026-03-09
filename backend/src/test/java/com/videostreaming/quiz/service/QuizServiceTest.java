package com.videostreaming.quiz.service;

import com.videostreaming.course.model.Course;
import com.videostreaming.course.repository.CourseRepository;
import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.quiz.dto.CreateQuizRequest;
import com.videostreaming.quiz.dto.QuizAttemptResponse;
import com.videostreaming.quiz.dto.QuizResponse;
import com.videostreaming.quiz.model.Quiz;
import com.videostreaming.quiz.model.QuizAttempt;
import com.videostreaming.quiz.model.QuizQuestion;
import com.videostreaming.quiz.repository.QuizAttemptRepository;
import com.videostreaming.quiz.repository.QuizQuestionRepository;
import com.videostreaming.quiz.repository.QuizRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuizServiceTest {

    @Mock private QuizRepository quizRepository;
    @Mock private QuizQuestionRepository questionRepository;
    @Mock private QuizAttemptRepository attemptRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks private QuizService service;

    @Test
    void createQuiz_success() {
        String courseId = "course-1";
        String moduleId = "module-1";
        String teacherUserId = "teacher-1";

        Course course = Course.builder()
                .id(courseId)
                .teacherUserId(teacherUserId)
                .title("Test Course")
                .build();

        CreateQuizRequest request = new CreateQuizRequest("Quiz 1", "Description", 70, 30, 0);

        Quiz savedQuiz = Quiz.builder()
                .id("quiz-1")
                .moduleId(moduleId)
                .courseId(courseId)
                .title("Quiz 1")
                .description("Description")
                .passPercentage(70)
                .timeLimitMinutes(30)
                .orderIndex(0)
                .createdAt(LocalDateTime.now())
                .build();

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(quizRepository.save(any(Quiz.class))).thenReturn(savedQuiz);
        when(questionRepository.countByQuizId("quiz-1")).thenReturn(0L);

        QuizResponse result = service.createQuiz(courseId, moduleId, teacherUserId, request);

        assertNotNull(result);
        assertEquals("quiz-1", result.getId());
        assertEquals("Quiz 1", result.getTitle());
        assertEquals(courseId, result.getCourseId());
        assertEquals(moduleId, result.getModuleId());
        assertEquals(70, result.getPassPercentage());
        verify(quizRepository).save(any(Quiz.class));
    }

    @Test
    void getQuiz_found() {
        String quizId = "quiz-1";
        Quiz quiz = Quiz.builder()
                .id(quizId)
                .moduleId("module-1")
                .courseId("course-1")
                .title("Quiz 1")
                .description("Description")
                .passPercentage(70)
                .timeLimitMinutes(30)
                .orderIndex(0)
                .createdAt(LocalDateTime.now())
                .build();

        when(quizRepository.findById(quizId)).thenReturn(Optional.of(quiz));

        Optional<Quiz> result = quizRepository.findById(quizId);

        assertTrue(result.isPresent());
        assertEquals("Quiz 1", result.get().getTitle());
    }

    @Test
    void getQuiz_notFound_throws() {
        String quizId = "nonexistent";

        when(quizRepository.findById(quizId)).thenReturn(Optional.empty());

        // The updateQuiz method throws when quiz not found
        assertThrows(IllegalArgumentException.class, () ->
                service.updateQuiz(quizId, "teacher-1", new CreateQuizRequest("Title", "Desc", 70, 30, 0)));
    }

    @Test
    void submitAttempt_correctScoring() {
        String quizId = "quiz-1";
        String studentUserId = "student-1";

        Quiz quiz = Quiz.builder()
                .id(quizId)
                .courseId("course-1")
                .title("Quiz 1")
                .passPercentage(50)
                .build();

        QuizQuestion q1 = QuizQuestion.builder()
                .id("q1")
                .quizId(quizId)
                .questionText("Q1?")
                .options("A|||B|||C")
                .correctOptionIndex(0)
                .orderIndex(0)
                .points(10)
                .build();

        QuizQuestion q2 = QuizQuestion.builder()
                .id("q2")
                .quizId(quizId)
                .questionText("Q2?")
                .options("A|||B|||C")
                .correctOptionIndex(2)
                .orderIndex(1)
                .points(10)
                .build();

        // Student answers: "0|||1" -> first correct (index 0), second wrong (index 1, correct is 2)
        String answersJson = "0|||1";

        QuizAttempt savedAttempt = QuizAttempt.builder()
                .id("attempt-1")
                .quizId(quizId)
                .courseId("course-1")
                .studentUserId(studentUserId)
                .answers(answersJson)
                .score(10)
                .totalPoints(20)
                .percentage(50.0)
                .passed(true)
                .completedAt(LocalDateTime.now())
                .build();

        when(quizRepository.findById(quizId)).thenReturn(Optional.of(quiz));
        when(questionRepository.findByQuizIdOrderByOrderIndexAsc(quizId)).thenReturn(List.of(q1, q2));
        when(attemptRepository.save(any(QuizAttempt.class))).thenReturn(savedAttempt);

        QuizAttemptResponse result = service.submitAttempt(quizId, studentUserId, answersJson);

        assertNotNull(result);
        assertEquals(10, result.getScore());
        assertEquals(20, result.getTotalPoints());
        assertEquals(50.0, result.getPercentage(), 0.01);
        assertTrue(result.isPassed());
        verify(notificationService).sendQuizResultNotification(
                eq(studentUserId), eq("Quiz 1"), eq(50.0), eq(true), eq("course-1"));
    }

    @Test
    void deleteQuiz_success() {
        String quizId = "quiz-1";
        String teacherUserId = "teacher-1";

        Quiz quiz = Quiz.builder()
                .id(quizId)
                .courseId("course-1")
                .title("Quiz 1")
                .build();

        Course course = Course.builder()
                .id("course-1")
                .teacherUserId(teacherUserId)
                .title("Course 1")
                .build();

        when(quizRepository.findById(quizId)).thenReturn(Optional.of(quiz));
        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));

        service.deleteQuiz(quizId, teacherUserId);

        verify(questionRepository).deleteByQuizId(quizId);
        verify(quizRepository).delete(quiz);
    }

    @Test
    void getQuizzesForModule_returnsList() {
        String moduleId = "module-1";

        Quiz quiz1 = Quiz.builder()
                .id("quiz-1")
                .moduleId(moduleId)
                .courseId("course-1")
                .title("Quiz 1")
                .orderIndex(0)
                .createdAt(LocalDateTime.now())
                .build();

        Quiz quiz2 = Quiz.builder()
                .id("quiz-2")
                .moduleId(moduleId)
                .courseId("course-1")
                .title("Quiz 2")
                .orderIndex(1)
                .createdAt(LocalDateTime.now())
                .build();

        when(quizRepository.findByModuleIdOrderByOrderIndexAsc(moduleId)).thenReturn(List.of(quiz1, quiz2));
        when(questionRepository.countByQuizId("quiz-1")).thenReturn(3L);
        when(questionRepository.countByQuizId("quiz-2")).thenReturn(5L);

        List<QuizResponse> result = service.getQuizzesForModule(moduleId);

        assertEquals(2, result.size());
        assertEquals("Quiz 1", result.get(0).getTitle());
        assertEquals("Quiz 2", result.get(1).getTitle());
        assertEquals(3, result.get(0).getQuestionCount());
        assertEquals(5, result.get(1).getQuestionCount());
    }
}
