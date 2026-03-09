package com.videostreaming.scheduling.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.videostreaming.scheduling.dto.BookingResponse;
import com.videostreaming.scheduling.dto.CreateBookingRequest;
import com.videostreaming.scheduling.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BookingControllerTest {

    @Mock
    private BookingService bookingService;

    @InjectMocks
    private BookingController controller;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();
    }

    private static UsernamePasswordAuthenticationToken authUser(String userId, String role) {
        return new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    private BookingResponse buildBookingResponse(String id, String status) {
        BookingResponse response = new BookingResponse();
        response.setId(id);
        response.setClassId("class-1");
        response.setClassTitle("Intro to Algebra");
        response.setStudentUserId("student-1");
        response.setStatus(status);
        response.setPaidAmount(19.99);
        response.setCreatedAt(LocalDateTime.of(2025, 3, 1, 10, 0));
        return response;
    }

    @Test
    void bookClass_returns200() throws Exception {
        // given
        CreateBookingRequest request = new CreateBookingRequest("class-1", "pi_test123");
        BookingResponse response = buildBookingResponse("booking-1", "CONFIRMED");

        when(bookingService.bookClass(eq("student-1"), any(CreateBookingRequest.class)))
                .thenReturn(response);

        // when/then
        mockMvc.perform(post("/api/bookings")
                        .principal(authUser("student-1", "STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("booking-1"))
                .andExpect(jsonPath("$.classId").value("class-1"))
                .andExpect(jsonPath("$.classTitle").value("Intro to Algebra"))
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.paidAmount").value(19.99));
    }

    @Test
    void cancelBooking_returns200() throws Exception {
        // given
        BookingResponse response = buildBookingResponse("booking-1", "CANCELLED");
        response.setCancelledAt(LocalDateTime.of(2025, 3, 2, 8, 0));

        when(bookingService.cancelBooking("booking-1", "student-1")).thenReturn(response);

        // when/then
        mockMvc.perform(delete("/api/bookings/booking-1")
                        .principal(authUser("student-1", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("booking-1"))
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void getMyBookings_returns200() throws Exception {
        // given
        List<BookingResponse> bookings = List.of(
                buildBookingResponse("booking-1", "CONFIRMED"),
                buildBookingResponse("booking-2", "CONFIRMED"));

        when(bookingService.getMyBookings("student-1")).thenReturn(bookings);

        // when/then
        mockMvc.perform(get("/api/bookings")
                        .principal(authUser("student-1", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("booking-1"))
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"))
                .andExpect(jsonPath("$[1].id").value("booking-2"));
    }
}
