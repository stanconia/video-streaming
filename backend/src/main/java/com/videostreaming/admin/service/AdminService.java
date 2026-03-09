package com.videostreaming.admin.service;

import com.videostreaming.user.model.*;
import com.videostreaming.course.model.*;
import com.videostreaming.live.model.*;
import com.videostreaming.teacher.model.*;
import com.videostreaming.scheduling.model.*;
import com.videostreaming.notification.model.*;
import com.videostreaming.payment.model.*;
import com.videostreaming.review.model.*;
import com.videostreaming.quiz.model.*;
import com.videostreaming.assignment.model.*;
import com.videostreaming.discussion.model.*;
import com.videostreaming.messaging.model.*;
import com.videostreaming.certificate.model.*;
import com.videostreaming.admin.dto.AdminStatsResponse;
import com.videostreaming.user.dto.UserSummaryResponse;
import com.videostreaming.user.repository.*;
import com.videostreaming.course.repository.*;
import com.videostreaming.live.repository.*;
import com.videostreaming.teacher.repository.*;
import com.videostreaming.scheduling.repository.*;
import com.videostreaming.notification.repository.*;
import com.videostreaming.payment.repository.*;
import com.videostreaming.review.repository.*;
import com.videostreaming.quiz.repository.*;
import com.videostreaming.assignment.repository.*;
import com.videostreaming.discussion.repository.*;
import com.videostreaming.messaging.repository.*;
import com.videostreaming.certificate.repository.*;
import com.videostreaming.teacher.repository.TeacherApplicationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final TeacherApplicationRepository teacherApplicationRepository;

    public AdminService(UserRepository userRepository,
                        CourseRepository courseRepository,
                        CourseEnrollmentRepository courseEnrollmentRepository,
                        TeacherApplicationRepository teacherApplicationRepository) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.courseEnrollmentRepository = courseEnrollmentRepository;
        this.teacherApplicationRepository = teacherApplicationRepository;
    }

    public AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long totalTeachers = userRepository.countByRole(UserRole.TEACHER);
        long totalStudents = userRepository.countByRole(UserRole.STUDENT);
        long totalCourses = courseRepository.count();
        long totalEnrollments = courseEnrollmentRepository.countByStatus(EnrollmentStatus.ACTIVE)
                + courseEnrollmentRepository.countByStatus(EnrollmentStatus.COMPLETED);
        BigDecimal totalRevenue = courseEnrollmentRepository.sumTotalRevenue();

        long pendingApplications = teacherApplicationRepository.countByStatus(ApplicationStatus.PENDING);

        return new AdminStatsResponse(totalUsers, totalTeachers, totalStudents,
                totalCourses, totalEnrollments, totalRevenue, pendingApplications);
    }

    public Page<UserSummaryResponse> getUsers(int page, int size) {
        Page<User> users = userRepository.findAllBy(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return users.map(this::toUserSummary);
    }

    @Transactional
    public UserSummaryResponse changeUserRole(String userId, String newRole, String adminUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        UserRole role = UserRole.valueOf(newRole.toUpperCase());
        user.setRole(role);
        user = userRepository.save(user);

        logger.info("Admin {} changed role of user {} to {}", adminUserId, userId, newRole);
        return toUserSummary(user);
    }

    private UserSummaryResponse toUserSummary(User user) {
        return new UserSummaryResponse(user.getId(), user.getEmail(),
                user.getDisplayName(), user.getRole().name(), user.getCreatedAt());
    }
}
