package com.videostreaming.shared.controller;

import com.videostreaming.shared.service.FileService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("roomId") String roomId,
            @RequestParam("userId") String userId) {
        try {
            Map<String, Object> result = fileService.uploadFile(file, roomId, userId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed"));
        }
    }

    @GetMapping("/download/{roomId}/{filename}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String roomId,
            @PathVariable String filename) {
        try {
            File file = fileService.getFile(roomId, filename);
            Resource resource = new FileSystemResource(file);

            // Detect content type from filename
            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            String name = file.getName().toLowerCase();
            if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
                mediaType = MediaType.IMAGE_JPEG;
            } else if (name.endsWith(".png")) {
                mediaType = MediaType.IMAGE_PNG;
            } else if (name.endsWith(".gif")) {
                mediaType = MediaType.IMAGE_GIF;
            } else if (name.endsWith(".webp")) {
                mediaType = MediaType.parseMediaType("image/webp");
            } else if (name.endsWith(".pdf")) {
                mediaType = MediaType.APPLICATION_PDF;
            }

            // For images, serve inline so browsers can render them in <img> tags
            String disposition = mediaType.getType().equals("image") ? "inline" : "attachment";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + file.getName() + "\"")
                    .contentType(mediaType)
                    .body(resource);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
