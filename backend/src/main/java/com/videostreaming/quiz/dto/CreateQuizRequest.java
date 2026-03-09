package com.videostreaming.quiz.dto;

public class CreateQuizRequest {

    private String title;
    private String description;
    private int passPercentage;
    private Integer timeLimitMinutes;
    private int orderIndex;

    public CreateQuizRequest() {}

    public CreateQuizRequest(String title, String description, int passPercentage,
                             Integer timeLimitMinutes, int orderIndex) {
        this.title = title;
        this.description = description;
        this.passPercentage = passPercentage;
        this.timeLimitMinutes = timeLimitMinutes;
        this.orderIndex = orderIndex;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getPassPercentage() { return passPercentage; }
    public void setPassPercentage(int passPercentage) { this.passPercentage = passPercentage; }

    public Integer getTimeLimitMinutes() { return timeLimitMinutes; }
    public void setTimeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
}
