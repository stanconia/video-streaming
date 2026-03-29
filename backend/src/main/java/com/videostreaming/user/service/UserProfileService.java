package com.videostreaming.user.service;

import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import com.videostreaming.course.model.EnrollmentStatus;
import com.videostreaming.user.dto.UpdateUserProfileRequest;
import com.videostreaming.user.dto.UserProfileResponse;
import com.videostreaming.course.repository.CourseEnrollmentRepository;
import com.videostreaming.teacher.repository.TeacherProfileRepository;
import com.videostreaming.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final TeacherProfileRepository teacherProfileRepository;

    public UserProfileService(UserRepository userRepository,
                               CourseEnrollmentRepository courseEnrollmentRepository,
                               TeacherProfileRepository teacherProfileRepository) {
        this.userRepository = userRepository;
        this.courseEnrollmentRepository = courseEnrollmentRepository;
        this.teacherProfileRepository = teacherProfileRepository;
    }

    public UserProfileResponse getMyProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserProfileResponse response = toResponse(user);
        // Include private fields for own profile
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        return response;
    }

    public UserProfileResponse getPublicProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toResponse(user);
        // Note: email and phone are NOT set (remain null) for public profile
    }

    @Transactional
    public UserProfileResponse updateProfile(String userId, UpdateUserProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            user.setEmail(request.getEmail());
        }
        if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
            user.setDisplayName(request.getDisplayName());
            // Sync displayName to TeacherProfile if teacher
            if (user.getRole() == UserRole.TEACHER) {
                teacherProfileRepository.findByUserId(userId).ifPresent(tp -> {
                    tp.setDisplayName(request.getDisplayName());
                    teacherProfileRepository.save(tp);
                });
            }
        }
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getLocation() != null) user.setLocation(request.getLocation());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl());
            // Sync profileImageUrl to TeacherProfile if teacher
            if (user.getRole() == UserRole.TEACHER) {
                teacherProfileRepository.findByUserId(userId).ifPresent(tp -> {
                    tp.setProfileImageUrl(request.getProfileImageUrl());
                    teacherProfileRepository.save(tp);
                });
            }
        }
        if (request.getSubjectInterests() != null) user.setSubjectInterests(request.getSubjectInterests());

        user = userRepository.save(user);

        UserProfileResponse response = toResponse(user);
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        return response;
    }

    private UserProfileResponse toResponse(User user) {
        UserProfileResponse r = new UserProfileResponse();
        r.setId(user.getId());
        r.setDisplayName(user.getDisplayName());
        r.setRole(user.getRole().name());
        r.setLocation(user.getLocation());
        r.setBio(user.getBio());
        r.setProfileImageUrl(user.getProfileImageUrl());
        r.setCreatedAt(user.getCreatedAt());
        r.setSubjectInterests(user.getSubjectInterests());

        if (user.getRole() == UserRole.STUDENT) {
            r.setEnrolledCoursesCount(courseEnrollmentRepository.countByStudentUserIdAndStatus(user.getId(), EnrollmentStatus.ACTIVE));
            r.setCompletedCoursesCount(courseEnrollmentRepository.countByStudentUserIdAndStatus(user.getId(), EnrollmentStatus.COMPLETED));
        }
        if (user.getRole() == UserRole.TEACHER) {
            r.setTeacherProfileUserId(user.getId());
        }
        return r;
    }
}
