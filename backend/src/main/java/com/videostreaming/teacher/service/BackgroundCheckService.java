package com.videostreaming.teacher.service;

import com.videostreaming.teacher.model.TeacherProfile;
import com.videostreaming.teacher.dto.BackgroundCheckResponse;
import com.videostreaming.teacher.repository.TeacherProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class BackgroundCheckService {

    private static final Logger logger = LoggerFactory.getLogger(BackgroundCheckService.class);
    private final TeacherProfileRepository teacherProfileRepository;

    public BackgroundCheckService(TeacherProfileRepository teacherProfileRepository) {
        this.teacherProfileRepository = teacherProfileRepository;
    }

    public BackgroundCheckResponse initiateCheck(String teacherUserId) {
        TeacherProfile profile = teacherProfileRepository.findByUserId(teacherUserId)
                .orElseThrow(() -> new RuntimeException("Teacher profile not found"));
        // Mock implementation - in production, this would call Checkr API
        profile.setBackgroundCheckStatus("CLEAR");
        teacherProfileRepository.save(profile);
        logger.info("Background check initiated and auto-cleared for teacher {} (mock implementation)", teacherUserId);
        String now = LocalDateTime.now().toString();
        return new BackgroundCheckResponse("CLEAR", now, now);
    }

    public BackgroundCheckResponse getCheckStatus(String teacherUserId) {
        TeacherProfile profile = teacherProfileRepository.findByUserId(teacherUserId)
                .orElse(null);
        if (profile == null) {
            return new BackgroundCheckResponse("NOT_STARTED", null, null);
        }
        String status = profile.getBackgroundCheckStatus();
        if (status == null) {
            return new BackgroundCheckResponse("NOT_STARTED", null, null);
        }
        return new BackgroundCheckResponse(status, null, null);
    }
}
