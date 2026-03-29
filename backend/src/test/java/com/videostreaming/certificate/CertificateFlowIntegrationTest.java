package com.videostreaming.certificate;

import com.videostreaming.AbstractIntegrationTest;
import com.videostreaming.user.model.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class CertificateFlowIntegrationTest extends AbstractIntegrationTest {

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    // -------------------------------------------------------------------------
    // 1. Student with no completed courses gets an empty certificates list
    // -------------------------------------------------------------------------

    @Test
    void student_getCertificates_returnsEmptyInitially() throws Exception {
        String token = createUserAndGetToken(
                "student.cert.empty@example.com",
                "Cert Student Empty",
                UserRole.STUDENT
        );

        mockMvc.perform(get("/api/certificates")
                        .header("Authorization", authHeader(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // -------------------------------------------------------------------------
    // 2. Authenticated student can reach the certificates endpoint
    // -------------------------------------------------------------------------

    @Test
    void student_getCertificates_returns200() throws Exception {
        String token = createUserAndGetToken(
                "student.cert@example.com",
                "Cert Student",
                UserRole.STUDENT
        );

        mockMvc.perform(get("/api/certificates")
                        .header("Authorization", authHeader(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
