package com.videostreaming.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.videostreaming.AbstractIntegrationTest;
import org.junit.jupiter.api.*;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CouponFlowIntegrationTest extends AbstractIntegrationTest {

    private String teacherToken;
    private String classId;
    private String couponId;

    private static final String COUPON_CODE = "SAVE10-" + System.currentTimeMillis();

    // -------------------------------------------------------------------------
    // 1. Setup: register teacher and create a scheduled class
    // -------------------------------------------------------------------------

    @Test
    @Order(1)
    void setup() throws Exception {
        // Register teacher
        String teacherBody = objectMapper.writeValueAsString(Map.of(
                "email", "teacher.coupon@example.com",
                "password", "Password123!",
                "displayName", "Coupon Teacher",
                "role", "TEACHER",
                "headline", "Expert Teacher",
                "subjects", "Finance",
                "experienceYears", 7,
                "dateOfBirth", "1990-01-15"
        ));

        String teacherResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teacherBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();

        teacherToken = objectMapper.readTree(teacherResponse).get("token").asText();
        assertThat(teacherToken).isNotBlank();

        // Create a scheduled class
        String classBody = objectMapper.writeValueAsString(Map.of(
                "title", "Finance Basics",
                "description", "A beginner finance class",
                "subject", "Finance",
                "scheduledAt", "2026-12-15T14:00:00",
                "durationMinutes", 60,
                "maxStudents", 25,
                "price", 50.0,
                "currency", "USD"
        ));

        String classResponse = mockMvc.perform(post("/api/classes")
                        .header("Authorization", authHeader(teacherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(classBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();

        classId = objectMapper.readTree(classResponse).get("id").asText();
        assertThat(classId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 2. Teacher creates a coupon
    // -------------------------------------------------------------------------

    @Test
    @Order(2)
    void createCoupon() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "code", COUPON_CODE,
                "discountPercent", 10,
                "maxUses", 100,
                "validFrom", "2026-01-01T00:00:00",
                "validUntil", "2027-01-01T00:00:00"
        ));

        MvcResult result = mockMvc.perform(post("/api/coupons")
                        .header("Authorization", authHeader(teacherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.code").value(COUPON_CODE))
                .andExpect(jsonPath("$.discountPercent").value(10))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        couponId = json.get("id").asText();
        assertThat(couponId).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 3. Teacher retrieves their coupons
    // -------------------------------------------------------------------------

    @Test
    @Order(3)
    void getTeacherCoupons() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/coupons/my")
                        .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.isArray()).isTrue();
        assertThat(json.size()).isGreaterThanOrEqualTo(1);

        boolean found = false;
        for (JsonNode coupon : json) {
            if (COUPON_CODE.equals(coupon.get("code").asText())) {
                found = true;
                assertThat(coupon.get("discountPercent").asInt()).isEqualTo(10);
                break;
            }
        }
        assertThat(found).as("Teacher's coupon list should contain the created coupon").isTrue();
    }

    // -------------------------------------------------------------------------
    // 4. Public: validate the coupon against the class
    // -------------------------------------------------------------------------

    @Test
    @Order(4)
    void validateCoupon() throws Exception {
        mockMvc.perform(get("/api/coupons/validate")
                        .param("code", COUPON_CODE)
                        .param("classId", classId)
                        .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(COUPON_CODE))
                .andExpect(jsonPath("$.active").value(true));
    }

    // -------------------------------------------------------------------------
    // 5. Public: validate an invalid coupon code returns 400
    // -------------------------------------------------------------------------

    @Test
    @Order(5)
    void validateInvalidCode() throws Exception {
        mockMvc.perform(get("/api/coupons/validate")
                        .param("code", "INVALID_CODE_XYZ")
                        .param("classId", classId)
                        .header("Authorization", authHeader(teacherToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").isNotEmpty());
    }
}
