package com.videostreaming.shared.controller;

import com.videostreaming.shared.service.S3Service;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/local-files")
public class LocalFileController {

    private final S3Service s3Service;

    public LocalFileController(S3Service s3Service) {
        this.s3Service = s3Service;
    }

    @GetMapping("/**")
    public ResponseEntity<byte[]> serveFile(HttpServletRequest request) {
        if (!s3Service.isUsingLocalStorage()) {
            return ResponseEntity.notFound().build();
        }

        String fullPath = request.getRequestURI();
        String key = fullPath.replaceFirst("/api/local-files/", "");

        Path filePath = s3Service.getLocalStoragePath().resolve(key);
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        try {
            byte[] data = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(data);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
