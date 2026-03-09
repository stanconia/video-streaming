package com.videostreaming.shared.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class FileService {

    private static final Logger logger = LoggerFactory.getLogger(FileService.class);
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp",
            "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain", "application/zip"
    );

    private final Path uploadDir;

    public FileService() {
        this.uploadDir = Path.of(System.getProperty("java.io.tmpdir"), "edulive-uploads");
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            logger.error("Failed to create upload directory: {}", e.getMessage());
        }
    }

    public Map<String, Object> uploadFile(MultipartFile file, String roomId, String userId) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File exceeds maximum size of 50MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("File type not allowed: " + contentType);
        }

        String fileId = UUID.randomUUID().toString();
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String storedFilename = fileId + "_" + originalFilename;

        Path roomDir = uploadDir.resolve(roomId);
        Files.createDirectories(roomDir);

        Path filePath = roomDir.resolve(storedFilename);
        file.transferTo(filePath.toFile());

        String downloadUrl = "/api/files/download/" + roomId + "/" + storedFilename;

        logger.info("File uploaded: {} by {} in room {} ({})", originalFilename, userId, roomId, file.getSize());

        return Map.of(
                "fileId", fileId,
                "fileName", originalFilename,
                "fileSize", file.getSize(),
                "fileType", contentType,
                "downloadUrl", downloadUrl
        );
    }

    public File getFile(String roomId, String filename) {
        Path filePath = uploadDir.resolve(roomId).resolve(filename);
        File file = filePath.toFile();
        if (!file.exists()) {
            throw new IllegalArgumentException("File not found");
        }
        return file;
    }
}
