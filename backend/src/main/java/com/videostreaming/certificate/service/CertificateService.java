package com.videostreaming.certificate.service;

import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.certificate.model.Certificate;
import com.videostreaming.user.model.User;
import com.videostreaming.certificate.dto.CertificateResponse;
import com.videostreaming.certificate.repository.CertificateRepository;
import com.videostreaming.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CertificateService {

    private static final Logger logger = LoggerFactory.getLogger(CertificateService.class);

    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public CertificateService(CertificateRepository certificateRepository, UserRepository userRepository,
                               NotificationService notificationService) {
        this.certificateRepository = certificateRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public CertificateResponse generateCertificate(String classId, String studentUserId,
                                                     String classTitle, String teacherDisplayName) {
        if (certificateRepository.existsByClassIdAndStudentUserId(classId, studentUserId)) {
            throw new RuntimeException("Certificate already issued for this student and class");
        }

        Certificate certificate = Certificate.builder()
                .classId(classId)
                .studentUserId(studentUserId)
                .classTitle(classTitle)
                .teacherDisplayName(teacherDisplayName)
                .completedAt(LocalDateTime.now())
                .build();

        certificate = certificateRepository.save(certificate);
        logger.info("Certificate generated for student {} in class {}", studentUserId, classId);
        notificationService.sendCertificateIssuedNotification(studentUserId, classTitle);
        return toResponse(certificate);
    }

    @Transactional
    public List<CertificateResponse> generateCertificatesForClass(String classId, String classTitle,
                                                                    String teacherDisplayName,
                                                                    List<String> studentUserIds) {
        List<CertificateResponse> responses = new ArrayList<>();

        for (String studentUserId : studentUserIds) {
            try {
                CertificateResponse response = generateCertificate(classId, studentUserId,
                        classTitle, teacherDisplayName);
                responses.add(response);
            } catch (RuntimeException e) {
                logger.warn("Skipping certificate for student {} in class {}: {}",
                        studentUserId, classId, e.getMessage());
            }
        }

        logger.info("Generated {} certificates for class {}", responses.size(), classId);
        return responses;
    }

    public List<CertificateResponse> getMyCertificates(String userId) {
        return certificateRepository.findByStudentUserIdOrderByIssuedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public CertificateResponse getCertificate(String certificateId) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
        return toResponse(certificate);
    }

    private CertificateResponse toResponse(Certificate certificate) {
        String studentDisplayName = userRepository.findById(certificate.getStudentUserId())
                .map(User::getDisplayName)
                .orElse("Unknown");

        return new CertificateResponse(
                certificate.getId(),
                certificate.getClassId(),
                certificate.getStudentUserId(),
                studentDisplayName,
                certificate.getClassTitle(),
                certificate.getTeacherDisplayName(),
                certificate.getCompletedAt(),
                certificate.getCertificateUrl(),
                certificate.getIssuedAt()
        );
    }
}
