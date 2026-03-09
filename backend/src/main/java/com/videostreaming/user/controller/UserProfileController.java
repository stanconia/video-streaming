package com.videostreaming.user.controller;

import com.videostreaming.user.dto.UpdateUserProfileRequest;
import com.videostreaming.user.service.UserProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final com.videostreaming.shared.service.FileService fileService;

    public UserProfileController(UserProfileService userProfileService, com.videostreaming.shared.service.FileService fileService) {
        this.userProfileService = userProfileService;
        this.fileService = fileService;
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

            // Upload using FileService (stores locally or S3)
            Map<String, Object> uploadResult = fileService.uploadFile(file, "profile-images", userId);
            String imageUrl = (String) uploadResult.get("downloadUrl");

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
