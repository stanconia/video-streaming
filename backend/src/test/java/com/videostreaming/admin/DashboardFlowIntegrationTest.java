package com.videostreaming.admin;

import com.videostreaming.AbstractIntegrationTest;
import com.videostreaming.user.model.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
class DashboardFlowIntegrationTest extends AbstractIntegrationTest {

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    // -------------------------------------------------------------------------
    // 1. Teacher gets their dashboard
    // -------------------------------------------------------------------------

    @Test
    void teacher_getDashboard_returns200() throws Exception {
        String token = createUserAndGetToken(
                "teacher.dashboard@example.com",
                "Dashboard Teacher",
                UserRole.TEACHER
        );

        mockMvc.perform(get("/api/dashboard/teacher")
                        .header("Authorization", authHeader(token)))
                .andExpect(status().isOk());
    }

    // -------------------------------------------------------------------------
    // 2. Student gets their dashboard
    // -------------------------------------------------------------------------

    @Test
    void student_getDashboard_returns200() throws Exception {
        String token = createUserAndGetToken(
                "student.dashboard@example.com",
                "Dashboard Student",
                UserRole.STUDENT
        );

        mockMvc.perform(get("/api/dashboard/student")
                        .header("Authorization", authHeader(token)))
                .andExpect(status().isOk());
    }

    // -------------------------------------------------------------------------
    // 3. Admin gets global stats
    // -------------------------------------------------------------------------

    @Test
    void admin_getStats_returns200() throws Exception {
        String token = createUserAndGetToken(
                "admin.dashboard@example.com",
                "Dashboard Admin",
                UserRole.ADMIN
        );

        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", authHeader(token)))
                .andExpect(status().isOk());
    }

    // -------------------------------------------------------------------------
    // 4. Admin gets paginated user list
    // -------------------------------------------------------------------------

    @Test
    void admin_getUsers_returns200() throws Exception {
        String token = createUserAndGetToken(
                "admin.users@example.com",
                "Users Admin",
                UserRole.ADMIN
        );

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", authHeader(token))
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    // -------------------------------------------------------------------------
    // 5. Student cannot access admin stats (403)
    // -------------------------------------------------------------------------

    @Test
    void student_cannotAccessAdminStats_returns403() throws Exception {
        String token = createUserAndGetToken(
                "student.forbidden@example.com",
                "Forbidden Student",
                UserRole.STUDENT
        );

        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", authHeader(token)))
                .andExpect(status().isForbidden());
    }
}
