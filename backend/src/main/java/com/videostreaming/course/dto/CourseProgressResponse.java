package com.videostreaming.course.dto;

import java.util.List;

public class CourseProgressResponse {
    private String courseId;
    private String courseTitle;
    private double progressPercentage;
    private int totalLessons;
    private int completedLessons;
    private List<ModuleProgressResponse> modules;

    public CourseProgressResponse() {}

    public CourseProgressResponse(String courseId, String courseTitle, double progressPercentage,
                                  int totalLessons, int completedLessons,
                                  List<ModuleProgressResponse> modules) {
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.progressPercentage = progressPercentage;
        this.totalLessons = totalLessons;
        this.completedLessons = completedLessons;
        this.modules = modules;
    }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public double getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(double progressPercentage) { this.progressPercentage = progressPercentage; }

    public int getTotalLessons() { return totalLessons; }
    public void setTotalLessons(int totalLessons) { this.totalLessons = totalLessons; }

    public int getCompletedLessons() { return completedLessons; }
    public void setCompletedLessons(int completedLessons) { this.completedLessons = completedLessons; }

    public List<ModuleProgressResponse> getModules() { return modules; }
    public void setModules(List<ModuleProgressResponse> modules) { this.modules = modules; }
}
