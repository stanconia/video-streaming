package com.videostreaming.user.controller;

import com.videostreaming.user.dto.UpdateUserProfileRequest;
import com.videostreaming.user.service.UserProfileService;
import com.videostreaming.shared.service.S3Service;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final S3Service s3Service;

    public UserProfileController(UserProfileService userProfileService, S3Service s3Service) {
        this.userProfileService = userProfileService;
        this.s3Service = s3Service;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(userProfileService.getMyProfile(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(@RequestBody UpdateUserProfileRequest request,
                                              Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(userProfileService.updateProfile(userId, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/me/profile-image")
    public ResponseEntity<?> uploadProfileImage(@RequestParam("file") MultipartFile file,
                                                 Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();

            // Validate image type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only image files are allowed"));
            }
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("error", "Image must be smaller than 5MB"));
            }

            // Upload using S3Service (persistent: S3 in prod, local fallback in dev)
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image";
            String extension = originalFilename.contains(".") ? originalFilename.substring(originalFilename.lastIndexOf('.')) : ".jpg";
            String key = "profile-images/" + userId + "/" + UUID.randomUUID() + extension;
            s3Service.uploadFile(key, file.getBytes(), contentType);
            String imageUrl = "/api/local-files/" + key;

            // Update user's profileImageUrl
            UpdateUserProfileRequest updateReq = new UpdateUserProfileRequest();
            updateReq.setProfileImageUrl(imageUrl);
            var profile = userProfileService.updateProfile(userId, updateReq);

            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getPublicProfile(@PathVariable String userId) {
        try {
            return ResponseEntity.ok(userProfileService.getPublicProfile(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
