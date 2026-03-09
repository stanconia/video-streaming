package com.videostreaming.course.dto;

public class UploadMaterialRequest {
    private String fileName;
    private String contentType;
    private long fileSize;

    public UploadMaterialRequest() {}

    public UploadMaterialRequest(String fileName, String contentType, long fileSize) {
        this.fileName = fileName;
        this.contentType = contentType;
        this.fileSize = fileSize;
    }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
}
