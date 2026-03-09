package com.videostreaming.course.dto;

public class CreateModuleRequest {
    private String title;
    private String description;
    private int orderIndex;

    public CreateModuleRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
}
