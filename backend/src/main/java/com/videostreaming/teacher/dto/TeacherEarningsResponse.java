package com.videostreaming.teacher.dto;

public class TeacherEarningsResponse {
    private String classId;
    private String classTitle;
    private String studentName;
    private double amount;
    private double platformFee;
    private double teacherPayout;
    private String payoutStatus;
    private String date;

    public TeacherEarningsResponse() {}

    public TeacherEarningsResponse(String classId, String classTitle, String studentName, double amount, double platformFee, double teacherPayout, String payoutStatus, String date) {
        this.classId = classId;
        this.classTitle = classTitle;
        this.studentName = studentName;
        this.amount = amount;
        this.platformFee = platformFee;
        this.teacherPayout = teacherPayout;
        this.payoutStatus = payoutStatus;
        this.date = date;
    }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }
    public String getClassTitle() { return classTitle; }
    public void setClassTitle(String classTitle) { this.classTitle = classTitle; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public double getPlatformFee() { return platformFee; }
    public void setPlatformFee(double platformFee) { this.platformFee = platformFee; }
    public double getTeacherPayout() { return teacherPayout; }
    public void setTeacherPayout(double teacherPayout) { this.teacherPayout = teacherPayout; }
    public String getPayoutStatus() { return payoutStatus; }
    public void setPayoutStatus(String payoutStatus) { this.payoutStatus = payoutStatus; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
}
