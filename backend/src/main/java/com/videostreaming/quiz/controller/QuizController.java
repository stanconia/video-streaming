package com.videostreaming.quiz.controller;

import com.videostreaming.quiz.model.QuizQuestion;
import com.videostreaming.quiz.dto.CreateQuizRequest;
import com.videostreaming.quiz.dto.QuizAttemptResponse;
import com.videostreaming.quiz.dto.QuizQuestionRequest;
import com.videostreaming.quiz.dto.QuizResponse;
import com.videostreaming.quiz.service.QuizService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses/{courseId}")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @PostMapping("/modules/{moduleId}/quizzes")
    public ResponseEntity<?> createQuiz(@PathVariable String courseId,
                                         @PathVariable String moduleId,
                                         @RequestBody CreateQuizRequest request,
                                         Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            QuizResponse response = quizService.createQuiz(courseId, moduleId, userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/quizzes/{quizId}")
    public ResponseEntity<?> updateQuiz(@PathVariable String courseId,
                                         @PathVariable String quizId,
                                         @RequestBody CreateQuizRequest request,
                                         Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            QuizResponse response = quizService.updateQuiz(quizId, userId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/quizzes/{quizId}")
    public ResponseEntity<?> deleteQuiz(@PathVariable String courseId,
                                         @PathVariable String quizId,
                                         Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            quizService.deleteQuiz(quizId, userId);
            return ResponseEntity.ok(Map.of("message", "Quiz deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/modules/{moduleId}/quizzes")
    public ResponseEntity<List<QuizResponse>> getQuizzesForModule(@PathVariable String courseId,
                                                                    @PathVariable String moduleId) {
        return ResponseEntity.ok(quizService.getQuizzesForModule(moduleId));
    }

    @PostMapping("/quizzes/{quizId}/questions")
    public ResponseEntity<?> addQuestion(@PathVariable String courseId,
                                          @PathVariable String quizId,
                                          @RequestBody QuizQuestionRequest request,
                                          Authentication authentication) {
        try {
            QuizQuestion question = quizService.addQuestion(quizId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(question);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/quizzes/{quizId}/questions/{questionId}")
    public ResponseEntity<?> updateQuestion(@PathVariable String courseId,
                                             @PathVariable String quizId,
                                             @PathVariable String questionId,
                                             @RequestBody QuizQuestionRequest request,
                                             Authentication authentication) {
        try {
            QuizQuestion question = quizService.updateQuestion(questionId, request);
            return ResponseEntity.ok(question);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/quizzes/{quizId}/questions/{questionId}")
    public ResponseEntity<?> deleteQuestion(@PathVariable String courseId,
                                             @PathVariable String quizId,
                                             @PathVariable String questionId,
                                             Authentication authentication) {
        try {
            quizService.deleteQuestion(questionId);
            return ResponseEntity.ok(Map.of("message", "Question deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/quizzes/{quizId}/questions")
    public ResponseEntity<List<QuizQuestion>> getQuestions(@PathVariable String courseId,
                                                            @PathVariable String quizId) {
        return ResponseEntity.ok(quizService.getQuestions(quizId));
    }

    @PostMapping("/quizzes/{quizId}/attempts")
    public ResponseEntity<?> submitAttempt(@PathVariable String courseId,
                                            @PathVariable String quizId,
                                            @RequestBody Map<String, String> body,
                                            Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            String answers = body.get("answers");
            QuizAttemptResponse response = quizService.submitAttempt(quizId, userId, answers);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/quizzes/{quizId}/attempts/mine")
    public ResponseEntity<?> getMyAttempts(@PathVariable String courseId,
                                            @PathVariable String quizId,
                                            Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            List<QuizAttemptResponse> responses = quizService.getMyAttempts(quizId, userId);
            return ResponseEntity.ok(responses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
