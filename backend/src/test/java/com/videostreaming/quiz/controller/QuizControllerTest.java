package com.videostreaming.quiz.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.videostreaming.quiz.dto.CreateQuizRequest;
import com.videostreaming.quiz.dto.QuizAttemptResponse;
import com.videostreaming.quiz.dto.QuizResponse;
import com.videostreaming.quiz.service.QuizService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class QuizControllerTest {

    @Mock
    private QuizService quizService;

    @InjectMocks
    private QuizController controller;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();
    }

    private static UsernamePasswordAuthenticationToken authUser(String userId, String role) {
        return new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    private QuizResponse buildQuizResponse(String id) {
        QuizResponse response = new QuizResponse();
        response.setId(id);
        response.setModuleId("module-1");
        response.setCourseId("course-1");
        response.setTitle("Test Quiz");
        response.setDescription("A quiz about testing");
        response.setPassPercentage(70);
        response.setTimeLimitMinutes(30);
        response.setOrderIndex(1);
        response.setQuestionCount(10);
        response.setCreatedAt(LocalDateTime.of(2025, 3, 1, 10, 0));
        return response;
    }

    private QuizAttemptResponse buildAttemptResponse(String id) {
        QuizAttemptResponse response = new QuizAttemptResponse();
        response.setId(id);
        response.setQuizId("quiz-1");
        response.setQuizTitle("Test Quiz");
        response.setCourseId("course-1");
        response.setStudentUserId("student-1");
        response.setScore(8);
        response.setTotalPoints(10);
        response.setPercentage(80.0);
        response.setPassed(true);
        response.setStartedAt(LocalDateTime.of(2025, 3, 1, 14, 0));
        response.setCompletedAt(LocalDateTime.of(2025, 3, 1, 14, 25));
        return response;
    }

    @Test
    void createQuiz_returns201() throws Exception {
        // given
        CreateQuizRequest request = new CreateQuizRequest("Test Quiz", "A quiz about testing", 70, 30, 1);
        QuizResponse response = buildQuizResponse("quiz-1");

        when(quizService.createQuiz(eq("course-1"), eq("module-1"), eq("teacher-1"), any(CreateQuizRequest.class)))
                .thenReturn(response);

        // when/then
        mockMvc.perform(post("/api/courses/course-1/modules/module-1/quizzes")
                        .principal(authUser("teacher-1", "TEACHER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("quiz-1"))
                .andExpect(jsonPath("$.title").value("Test Quiz"))
                .andExpect(jsonPath("$.passPercentage").value(70))
                .andExpect(jsonPath("$.timeLimitMinutes").value(30))
                .andExpect(jsonPath("$.questionCount").value(10));
    }

    @Test
    void getQuizzesForModule_returns200() throws Exception {
        // given
        List<QuizResponse> quizzes = List.of(buildQuizResponse("quiz-1"));

        when(quizService.getQuizzesForModule("module-1")).thenReturn(quizzes);

        // when/then
        mockMvc.perform(get("/api/courses/course-1/modules/module-1/quizzes")
                        .principal(authUser("student-1", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("quiz-1"))
                .andExpect(jsonPath("$[0].title").value("Test Quiz"));
    }

    @Test
    void submitAttempt_returns201() throws Exception {
        // given
        QuizAttemptResponse attemptResponse = buildAttemptResponse("attempt-1");

        when(quizService.submitAttempt(eq("quiz-1"), eq("student-1"), eq("{\"q1\":\"a\"}")))
                .thenReturn(attemptResponse);

        Map<String, String> body = Map.of("answers", "{\"q1\":\"a\"}");

        // when/then
        mockMvc.perform(post("/api/courses/course-1/quizzes/quiz-1/attempts")
                        .principal(authUser("student-1", "STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("attempt-1"))
                .andExpect(jsonPath("$.score").value(8))
                .andExpect(jsonPath("$.totalPoints").value(10))
                .andExpect(jsonPath("$.percentage").value(80.0))
                .andExpect(jsonPath("$.passed").value(true));
    }

    @Test
    void deleteQuiz_returns200() throws Exception {
        // given
        doNothing().when(quizService).deleteQuiz("quiz-1", "teacher-1");

        // when/then
        mockMvc.perform(delete("/api/courses/course-1/quizzes/quiz-1")
                        .principal(authUser("teacher-1", "TEACHER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Quiz deleted"));
    }
}
