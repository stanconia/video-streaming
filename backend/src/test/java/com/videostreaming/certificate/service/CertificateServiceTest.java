package com.videostreaming.certificate.service;

import com.videostreaming.certificate.dto.CertificateResponse;
import com.videostreaming.certificate.model.Certificate;
import com.videostreaming.certificate.repository.CertificateRepository;
import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import com.videostreaming.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CertificateServiceTest {

    @Mock private CertificateRepository certificateRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks private CertificateService service;

    @Test
    void generateCertificate_success() {
        String classId = "class-1";
        String studentUserId = "student-1";
        String classTitle = "Piano 101";
        String teacherDisplayName = "Dr. Smith";

        Certificate savedCertificate = Certificate.builder()
                .id("cert-1")
                .classId(classId)
                .studentUserId(studentUserId)
                .classTitle(classTitle)
                .teacherDisplayName(teacherDisplayName)
                .completedAt(LocalDateTime.now())
                .issuedAt(LocalDateTime.now())
                .build();

        User student = User.builder()
                .id(studentUserId)
                .displayName("Jane Student")
                .email("jane@test.com")
                .role(UserRole.STUDENT)
                .build();

        when(certificateRepository.existsByClassIdAndStudentUserId(classId, studentUserId))
                .thenReturn(false);
        when(certificateRepository.save(any(Certificate.class))).thenReturn(savedCertificate);
        when(userRepository.findById(studentUserId)).thenReturn(Optional.of(student));

        CertificateResponse result = service.generateCertificate(classId, studentUserId, classTitle, teacherDisplayName);

        assertNotNull(result);
        assertEquals("cert-1", result.getId());
        assertEquals(classId, result.getClassId());
        assertEquals(studentUserId, result.getStudentUserId());
        assertEquals("Jane Student", result.getStudentDisplayName());
        assertEquals(classTitle, result.getClassTitle());
        assertEquals(teacherDisplayName, result.getTeacherDisplayName());
        verify(notificationService).sendCertificateIssuedNotification(eq(studentUserId), eq(classTitle));
    }

    @Test
    void getCertificatesForStudent_returnsList() {
        String studentUserId = "student-1";

        Certificate cert1 = Certificate.builder()
                .id("cert-1")
                .classId("class-1")
                .studentUserId(studentUserId)
                .classTitle("Piano 101")
                .teacherDisplayName("Dr. Smith")
                .completedAt(LocalDateTime.now())
                .issuedAt(LocalDateTime.now())
                .build();

        Certificate cert2 = Certificate.builder()
                .id("cert-2")
                .classId("class-2")
                .studentUserId(studentUserId)
                .classTitle("Guitar 101")
                .teacherDisplayName("Prof. Jones")
                .completedAt(LocalDateTime.now())
                .issuedAt(LocalDateTime.now())
                .build();

        User student = User.builder()
                .id(studentUserId)
                .displayName("Jane Student")
                .email("jane@test.com")
                .role(UserRole.STUDENT)
                .build();

        when(certificateRepository.findByStudentUserIdOrderByIssuedAtDesc(studentUserId))
                .thenReturn(List.of(cert1, cert2));
        when(userRepository.findById(studentUserId)).thenReturn(Optional.of(student));

        List<CertificateResponse> result = service.getMyCertificates(studentUserId);

        assertEquals(2, result.size());
        assertEquals("Piano 101", result.get(0).getClassTitle());
        assertEquals("Guitar 101", result.get(1).getClassTitle());
        assertEquals("Jane Student", result.get(0).getStudentDisplayName());
    }

    @Test
    void getCertificate_notFound_throws() {
        String certificateId = "nonexistent";

        when(certificateRepository.findById(certificateId)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                service.getCertificate(certificateId));

        assertTrue(exception.getMessage().contains("Certificate not found"));
    }

    @Test
    void generateCertificate_alreadyExists_throws() {
        String classId = "class-1";
        String studentUserId = "student-1";

        when(certificateRepository.existsByClassIdAndStudentUserId(classId, studentUserId))
                .thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                service.generateCertificate(classId, studentUserId, "Class Title", "Teacher Name"));

        assertTrue(exception.getMessage().contains("Certificate already issued"));
        verify(certificateRepository, never()).save(any());
    }
}
