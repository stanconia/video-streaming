package com.videostreaming.quiz.service;

import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.course.model.Course;
import com.videostreaming.quiz.model.Quiz;
import com.videostreaming.quiz.model.QuizAttempt;
import com.videostreaming.quiz.model.QuizQuestion;
import com.videostreaming.quiz.dto.CreateQuizRequest;
import com.videostreaming.quiz.dto.QuizAttemptResponse;
import com.videostreaming.quiz.dto.QuizQuestionRequest;
import com.videostreaming.quiz.dto.QuizResponse;
import com.videostreaming.course.repository.CourseRepository;
import com.videostreaming.quiz.repository.QuizAttemptRepository;
import com.videostreaming.quiz.repository.QuizQuestionRepository;
import com.videostreaming.quiz.repository.QuizRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private static final Logger logger = LoggerFactory.getLogger(QuizService.class);

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizAttemptRepository attemptRepository;
    private final CourseRepository courseRepository;
    private final NotificationService notificationService;

    public QuizService(QuizRepository quizRepository,
                       QuizQuestionRepository questionRepository,
                       QuizAttemptRepository attemptRepository,
                       CourseRepository courseRepository,
                       NotificationService notificationService) {
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.attemptRepository = attemptRepository;
        this.courseRepository = courseRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public QuizResponse createQuiz(String courseId, String moduleId, String teacherUserId,
                                    CreateQuizRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the course teacher can create quizzes");
        }

        Quiz quiz = Quiz.builder()
                .moduleId(moduleId)
                .courseId(courseId)
                .title(request.getTitle())
                .description(request.getDescription())
                .passPercentage(request.getPassPercentage())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .orderIndex(request.getOrderIndex())
                .build();

        quiz = quizRepository.save(quiz);
        logger.info("Created quiz {} for course {} module {}", quiz.getId(), courseId, moduleId);
        return toQuizResponse(quiz);
    }

    @Transactional
    public QuizResponse updateQuiz(String quizId, String teacherUserId, CreateQuizRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        Course course = courseRepository.findById(quiz.getCourseId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the course teacher can update quizzes");
        }

        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setPassPercentage(request.getPassPercentage());
        quiz.setTimeLimitMinutes(request.getTimeLimitMinutes());
        quiz.setOrderIndex(request.getOrderIndex());

        quiz = quizRepository.save(quiz);
        logger.info("Updated quiz {}", quizId);
        return toQuizResponse(quiz);
    }

    @Transactional
    public void deleteQuiz(String quizId, String teacherUserId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        Course course = courseRepository.findById(quiz.getCourseId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("Only the course teacher can delete quizzes");
        }

        questionRepository.deleteByQuizId(quizId);
        quizRepository.delete(quiz);
        logger.info("Deleted quiz {}", quizId);
    }

    public List<QuizResponse> getQuizzesForModule(String moduleId) {
        return quizRepository.findByModuleIdOrderByOrderIndexAsc(moduleId)
                .stream().map(this::toQuizResponse).collect(Collectors.toList());
    }

    @Transactional
    public QuizQuestion addQuestion(String quizId, QuizQuestionRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        String optionsStr = String.join("|||", request.getOptions());

        int nextOrder = (int) questionRepository.countByQuizId(quizId);

        QuizQuestion question = QuizQuestion.builder()
                .quizId(quizId)
                .questionText(request.getQuestionText())
                .options(optionsStr)
                .correctOptionIndex(request.getCorrectOptionIndex())
                .orderIndex(nextOrder)
                .points(request.getPoints())
                .build();

        question = questionRepository.save(question);
        logger.info("Added question {} to quiz {}", question.getId(), quizId);
        return question;
    }

    @Transactional
    public QuizQuestion updateQuestion(String questionId, QuizQuestionRequest request) {
        QuizQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found"));

        question.setQuestionText(request.getQuestionText());
        question.setOptions(String.join("|||", request.getOptions()));
        question.setCorrectOptionIndex(request.getCorrectOptionIndex());
        question.setPoints(request.getPoints());

        question = questionRepository.save(question);
        logger.info("Updated question {}", questionId);
        return question;
    }

    @Transactional
    public void deleteQuestion(String questionId) {
        QuizQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found"));

        questionRepository.delete(question);
        logger.info("Deleted question {}", questionId);
    }

    public List<QuizQuestion> getQuestions(String quizId) {
        return questionRepository.findByQuizIdOrderByOrderIndexAsc(quizId);
    }

    @Transactional
    public QuizAttemptResponse submitAttempt(String quizId, String studentUserId, String answersJson) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderByOrderIndexAsc(quizId);
        if (questions.isEmpty()) {
            throw new RuntimeException("Quiz has no questions");
        }

        String[] answerParts = answersJson.split("\\|\\|\\|");

        int score = 0;
        int totalPoints = 0;

        for (int i = 0; i < questions.size(); i++) {
            QuizQuestion q = questions.get(i);
            totalPoints += q.getPoints();

            if (i < answerParts.length) {
                try {
                    int selectedIndex = Integer.parseInt(answerParts[i].trim());
                    if (selectedIndex == q.getCorrectOptionIndex()) {
                        score += q.getPoints();
                    }
                } catch (NumberFormatException e) {
                    // Invalid answer, no points awarded
                }
            }
        }

        double percentage = totalPoints > 0 ? (double) score / totalPoints * 100.0 : 0.0;
        boolean passed = percentage >= quiz.getPassPercentage();

        QuizAttempt attempt = QuizAttempt.builder()
                .quizId(quizId)
                .courseId(quiz.getCourseId())
                .studentUserId(studentUserId)
                .answers(answersJson)
                .score(score)
                .totalPoints(totalPoints)
                .percentage(percentage)
                .passed(passed)
                .completedAt(LocalDateTime.now())
                .build();

        attempt = attemptRepository.save(attempt);
        logger.info("Student {} submitted attempt for quiz {} - score: {}/{} ({}%) passed: {}",
                studentUserId, quizId, score, totalPoints, percentage, passed);

        notificationService.sendQuizResultNotification(
                studentUserId, quiz.getTitle(), percentage, passed, quiz.getCourseId());

        return toAttemptResponse(attempt, quiz.getTitle());
    }

    public List<QuizAttemptResponse> getMyAttempts(String quizId, String studentUserId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        return attemptRepository.findByQuizIdAndStudentUserIdOrderByCompletedAtDesc(quizId, studentUserId)
                .stream().map(a -> toAttemptResponse(a, quiz.getTitle())).collect(Collectors.toList());
    }

    private QuizResponse toQuizResponse(Quiz quiz) {
        int questionCount = (int) questionRepository.countByQuizId(quiz.getId());
        return new QuizResponse(
                quiz.getId(),
                quiz.getModuleId(),
                quiz.getCourseId(),
                quiz.getTitle(),
                quiz.getDescription(),
                quiz.getPassPercentage(),
                quiz.getTimeLimitMinutes(),
                quiz.getOrderIndex(),
                questionCount,
                quiz.getCreatedAt()
        );
    }

    private QuizAttemptResponse toAttemptResponse(QuizAttempt attempt, String quizTitle) {
        return new QuizAttemptResponse(
                attempt.getId(),
                attempt.getQuizId(),
                quizTitle,
                attempt.getCourseId(),
                attempt.getStudentUserId(),
                attempt.getScore(),
                attempt.getTotalPoints(),
                attempt.getPercentage(),
                attempt.isPassed(),
                attempt.getStartedAt(),
                attempt.getCompletedAt()
        );
    }
}
