package com.videostreaming.quiz.model;

import jakarta.persistence.*;

@Entity
@Table(name = "quiz_questions")
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String quizId;

    @Column(length = 2000, nullable = false)
    private String questionText;

    @Column(length = 5000)
    private String options;

    private int correctOptionIndex;

    private int orderIndex;

    private int points = 1;

    public QuizQuestion() {}

    public QuizQuestion(String id, String quizId, String questionText, String options,
                        int correctOptionIndex, int orderIndex, int points) {
        this.id = id;
        this.quizId = quizId;
        this.questionText = questionText;
        this.options = options;
        this.correctOptionIndex = correctOptionIndex;
        this.orderIndex = orderIndex;
        this.points = points;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getQuizId() { return quizId; }
    public void setQuizId(String quizId) { this.quizId = quizId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getOptions() { return options; }
    public void setOptions(String options) { this.options = options; }

    public int getCorrectOptionIndex() { return correctOptionIndex; }
    public void setCorrectOptionIndex(int correctOptionIndex) { this.correctOptionIndex = correctOptionIndex; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }

    public static QuizQuestionBuilder builder() {
        return new QuizQuestionBuilder();
    }

    public static class QuizQuestionBuilder {
        private String id;
        private String quizId;
        private String questionText;
        private String options;
        private int correctOptionIndex;
        private int orderIndex;
        private int points = 1;

        public QuizQuestionBuilder id(String id) { this.id = id; return this; }
        public QuizQuestionBuilder quizId(String quizId) { this.quizId = quizId; return this; }
        public QuizQuestionBuilder questionText(String questionText) { this.questionText = questionText; return this; }
        public QuizQuestionBuilder options(String options) { this.options = options; return this; }
        public QuizQuestionBuilder correctOptionIndex(int correctOptionIndex) { this.correctOptionIndex = correctOptionIndex; return this; }
        public QuizQuestionBuilder orderIndex(int orderIndex) { this.orderIndex = orderIndex; return this; }
        public QuizQuestionBuilder points(int points) { this.points = points; return this; }

        public QuizQuestion build() {
            return new QuizQuestion(id, quizId, questionText, options, correctOptionIndex, orderIndex, points);
        }
    }
}
