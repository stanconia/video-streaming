package com.videostreaming.assignment.dto;

public class CreateAssignmentRequest {

    private String title;
    private String description;
    private String dueDate;
    private int maxScore;
    private int orderIndex;

    public CreateAssignmentRequest() {}

    public CreateAssignmentRequest(String title, String description, String dueDate,
                                   int maxScore, int orderIndex) {
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.maxScore = maxScore;
        this.orderIndex = orderIndex;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public int getMaxScore() { return maxScore; }
    public void setMaxScore(int maxScore) { this.maxScore = maxScore; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
}
