package com.videostreaming.teacher.service;

import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.teacher.service.TeacherProfileService;
import com.videostreaming.teacher.model.ApplicationStatus;
import com.videostreaming.teacher.model.TeacherApplication;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import com.videostreaming.teacher.dto.TeacherApplicationResponse;
import com.videostreaming.teacher.repository.TeacherApplicationRepository;
import com.videostreaming.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TeacherApplicationService {

    private static final Logger logger = LoggerFactory.getLogger(TeacherApplicationService.class);

    private final TeacherApplicationRepository teacherApplicationRepository;
    private final UserRepository userRepository;
    private final TeacherProfileService teacherProfileService;
    private final NotificationService notificationService;

    public TeacherApplicationService(TeacherApplicationRepository teacherApplicationRepository,
                                      UserRepository userRepository,
                                      TeacherProfileService teacherProfileService,
                                      NotificationService notificationService) {
        this.teacherApplicationRepository = teacherApplicationRepository;
        this.userRepository = userRepository;
        this.teacherProfileService = teacherProfileService;
        this.notificationService = notificationService;
    }

    @Transactional
    public TeacherApplicationResponse submitApplication(String userId, String notes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == UserRole.TEACHER) {
            throw new RuntimeException("You are already a teacher");
        }

        List<ApplicationStatus> activeStatuses = List.of(ApplicationStatus.PENDING, ApplicationStatus.APPROVED);
        if (teacherApplicationRepository.existsByUserIdAndStatusIn(userId, activeStatuses)) {
            throw new RuntimeException("You already have a pending or approved application");
        }

        TeacherApplication application = TeacherApplication.builder()
                .userId(userId)
                .notes(notes)
                .build();

        application = teacherApplicationRepository.save(application);
        logger.info("Teacher application submitted by user {}", userId);
        return toResponse(application);
    }

    public List<TeacherApplicationResponse> getApplications(String status) {
        List<TeacherApplication> applications;
        if (status != null && !status.isEmpty()) {
            ApplicationStatus appStatus = ApplicationStatus.valueOf(status.toUpperCase());
            applications = teacherApplicationRepository.findByStatusOrderBySubmittedAtDesc(appStatus);
        } else {
            applications = teacherApplicationRepository.findAllByOrderBySubmittedAtDesc();
        }
        return applications.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public TeacherApplicationResponse getMyApplication(String userId) {
        TeacherApplication application = teacherApplicationRepository
                .findByUserIdAndStatus(userId, ApplicationStatus.PENDING)
                .or(() -> teacherApplicationRepository.findByUserIdAndStatus(userId, ApplicationStatus.APPROVED))
                .or(() -> teacherApplicationRepository.findByUserIdAndStatus(userId, ApplicationStatus.REJECTED))
                .orElse(null);

        if (application == null) return null;
        return toResponse(application);
    }

    @Transactional
    public TeacherApplicationResponse approveApplication(String applicationId, String adminUserId) {
        TeacherApplication application = teacherApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new RuntimeException("Application is not pending");
        }

        application.setStatus(ApplicationStatus.APPROVED);
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewedBy(adminUserId);
        application = teacherApplicationRepository.save(application);

        // Change user role to TEACHER
        User user = userRepository.findById(application.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(UserRole.TEACHER);
        userRepository.save(user);

        // Create blank teacher profile
        teacherProfileService.createBlankProfile(application.getUserId());

        // Send notification
        notificationService.sendApplicationApprovedNotification(application.getUserId());

        logger.info("Teacher application {} approved by admin {}", applicationId, adminUserId);
        return toResponse(application);
    }

    @Transactional
    public TeacherApplicationResponse rejectApplication(String applicationId, String adminUserId) {
        TeacherApplication application = teacherApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new RuntimeException("Application is not pending");
        }

        application.setStatus(ApplicationStatus.REJECTED);
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewedBy(adminUserId);
        application = teacherApplicationRepository.save(application);

        notificationService.sendApplicationRejectedNotification(application.getUserId());

        logger.info("Teacher application {} rejected by admin {}", applicationId, adminUserId);
        return toResponse(application);
    }

    private TeacherApplicationResponse toResponse(TeacherApplication app) {
        User user = userRepository.findById(app.getUserId()).orElse(null);
        String displayName = user != null ? user.getDisplayName() : "Unknown";
        String email = user != null ? user.getEmail() : "";

        return new TeacherApplicationResponse(
                app.getId(), app.getUserId(), displayName, email,
                app.getStatus().name(), app.getNotes(),
                app.getSubmittedAt(), app.getReviewedAt(), app.getReviewedBy());
    }
}
