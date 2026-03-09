package com.videostreaming.teacher.service;

import com.videostreaming.teacher.model.TeacherProfile;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import com.videostreaming.teacher.dto.TeacherProfileRequest;
import com.videostreaming.teacher.dto.TeacherProfileResponse;
import com.videostreaming.review.repository.ReviewRepository;
import com.videostreaming.teacher.repository.TeacherProfileRepository;
import com.videostreaming.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TeacherProfileService {

    private static final Logger logger = LoggerFactory.getLogger(TeacherProfileService.class);

    private final TeacherProfileRepository teacherProfileRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    public TeacherProfileService(TeacherProfileRepository teacherProfileRepository,
                                  UserRepository userRepository,
                                  ReviewRepository reviewRepository) {
        this.teacherProfileRepository = teacherProfileRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
    }

    public TeacherProfileResponse getMyProfile(String userId) {
        TeacherProfile profile = teacherProfileRepository.findByUserId(userId)
                .orElseGet(() -> createBlankProfile(userId));
        return toResponse(profile);
    }

    @Transactional
    public TeacherProfileResponse updateProfile(String userId, TeacherProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TeacherProfile profile = teacherProfileRepository.findByUserId(userId)
                .orElseGet(() -> createBlankProfile(userId));

        if (request.getBio() != null) profile.setBio(request.getBio());
        if (request.getHeadline() != null) profile.setHeadline(request.getHeadline());
        if (request.getSubjects() != null) profile.setSubjects(request.getSubjects());
        profile.setHourlyRate(request.getHourlyRate());
        profile.setExperienceYears(request.getExperienceYears());
        if (request.getProfileImageUrl() != null) profile.setProfileImageUrl(request.getProfileImageUrl());

        // Sync displayName if changed
        profile.setDisplayName(user.getDisplayName());

        profile = teacherProfileRepository.save(profile);
        logger.info("Updated teacher profile for user {}", userId);
        return toResponse(profile);
    }

    public TeacherProfileResponse getTeacherProfile(String userId) {
        TeacherProfile profile = teacherProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Teacher profile not found"));
        return toResponse(profile);
    }

    public List<TeacherProfileResponse> searchTeachers(String subject, String query) {
        return teacherProfileRepository.searchTeachers(
                subject != null ? subject : "", query != null ? query : "").stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void refreshRatingStats(String teacherUserId) {
        teacherProfileRepository.findByUserId(teacherUserId).ifPresent(profile -> {
            Double avgRating = reviewRepository.findAverageRatingByTeacherUserId(teacherUserId);
            long count = reviewRepository.countByTeacherUserId(teacherUserId);
            profile.setAverageRating(avgRating != null ? avgRating : 0.0);
            profile.setReviewCount((int) count);
            teacherProfileRepository.save(profile);
            logger.info("Refreshed rating stats for teacher {}: avg={}, count={}", teacherUserId, avgRating, count);
        });
    }

    @Transactional
    public TeacherProfile createBlankProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TeacherProfile profile = TeacherProfile.builder()
                .userId(userId)
                .displayName(user.getDisplayName())
                .bio("")
                .headline("")
                .subjects("")
                .hourlyRate(0)
                .experienceYears(0)
                .build();

        profile = teacherProfileRepository.save(profile);
        logger.info("Created blank teacher profile for user {}", userId);
        return profile;
    }

    private TeacherProfileResponse toResponse(TeacherProfile p) {
        return new TeacherProfileResponse(
                p.getId(), p.getUserId(), p.getDisplayName(), p.getBio(),
                p.getHeadline(), p.getSubjects(), p.getHourlyRate(),
                p.getExperienceYears(), p.getProfileImageUrl(), p.isVerified(),
                p.getAverageRating(), p.getReviewCount(), p.getCreatedAt());
    }
}
