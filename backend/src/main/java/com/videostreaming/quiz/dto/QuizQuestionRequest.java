package com.videostreaming.quiz.dto;

import java.util.List;

public class QuizQuestionRequest {

    private String questionText;
    private List<String> options;
    private int correctOptionIndex;
    private int points;

    public QuizQuestionRequest() {}

    public QuizQuestionRequest(String questionText, List<String> options,
                               int correctOptionIndex, int points) {
        this.questionText = questionText;
        this.options = options;
        this.correctOptionIndex = correctOptionIndex;
        this.points = points;
    }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public int getCorrectOptionIndex() { return correctOptionIndex; }
    public void setCorrectOptionIndex(int correctOptionIndex) { this.correctOptionIndex = correctOptionIndex; }

    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }
}
