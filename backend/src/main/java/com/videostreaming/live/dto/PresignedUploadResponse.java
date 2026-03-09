package com.videostreaming.live.dto;

public class PresignedUploadResponse {
    private String uploadUrl;
    private String fileKey;

    public PresignedUploadResponse() {}

    public PresignedUploadResponse(String uploadUrl, String fileKey) {
        this.uploadUrl = uploadUrl;
        this.fileKey = fileKey;
    }

    public String getUploadUrl() { return uploadUrl; }
    public void setUploadUrl(String uploadUrl) { this.uploadUrl = uploadUrl; }

    public String getFileKey() { return fileKey; }
    public void setFileKey(String fileKey) { this.fileKey = fileKey; }
}
