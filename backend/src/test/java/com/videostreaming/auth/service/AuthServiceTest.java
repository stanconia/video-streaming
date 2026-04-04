package com.videostreaming.auth.service;

import com.videostreaming.auth.dto.AuthResponse;
import com.videostreaming.auth.dto.LoginRequest;
import com.videostreaming.auth.dto.RegisterRequest;
import com.videostreaming.notification.service.NotificationService;
import com.videostreaming.teacher.model.TeacherProfile;
import com.videostreaming.teacher.repository.TeacherProfileRepository;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import com.videostreaming.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private TeacherProfileRepository teacherProfileRepository;

    @InjectMocks
    private AuthService authService;

    // --- register tests ---

    @Test
    void register_success_returnsAuthResponseWithCorrectFields() {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123", "Test User", "STUDENT");
        request.setDateOfBirth("1990-01-15");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

        User savedUser = User.builder()
                .id("user-123")
                .email("test@example.com")
                .password("encodedPassword")
                .displayName("Test User")
                .role(UserRole.STUDENT)
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(savedUser)).thenReturn("jwt-token-abc");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("jwt-token-abc", response.getToken());
        assertEquals("user-123", response.getUserId());
        assertEquals("test@example.com", response.getEmail());
        assertEquals("Test User", response.getDisplayName());
        assertEquals("STUDENT", response.getRole());

        verify(userRepository).existsByEmail("test@example.com");
        verify(userRepository).save(any(User.class));
        verify(notificationService).sendWelcomeEmail("user-123");
        verify(jwtService).generateToken(savedUser);
    }

    @Test
    void register_teacherRole_createsTeacherProfile() {
        RegisterRequest request = new RegisterRequest("teacher@example.com", "password123", "Teacher User", "TEACHER");
        request.setDateOfBirth("1990-01-15");
        request.setHeadline("Expert Teacher");
        request.setSubjects("Math,Science");
        request.setExperienceYears(5);
        request.setBio("Experienced teacher");

        when(userRepository.existsByEmail("teacher@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

        User savedUser = User.builder()
                .id("teacher-456")
                .email("teacher@example.com")
                .password("encodedPassword")
                .displayName("Teacher User")
                .role(UserRole.TEACHER)
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(savedUser)).thenReturn("jwt-token-teacher");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("TEACHER", response.getRole());

        ArgumentCaptor<TeacherProfile> profileCaptor = ArgumentCaptor.forClass(TeacherProfile.class);
        verify(teacherProfileRepository).save(profileCaptor.capture());
        TeacherProfile savedProfile = profileCaptor.getValue();
        assertEquals("teacher-456", savedProfile.getUserId());
        assertEquals("Teacher User", savedProfile.getDisplayName());
    }

    @Test
    void register_duplicateEmail_throwsRuntimeException() {
        RegisterRequest request = new RegisterRequest("existing@example.com", "password123", "Test User", "STUDENT");
        request.setDateOfBirth("1990-01-15");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.register(request));
        assertEquals("Email already registered", exception.getMessage());

        verify(userRepository, never()).save(any(User.class));
    }

    // --- login tests ---

    @Test
    void login_success_returnsAuthResponseWithToken() {
        LoginRequest request = new LoginRequest("test@example.com", "password123");

        User existingUser = User.builder()
                .id("user-123")
                .email("test@example.com")
                .password("encodedPassword")
                .displayName("Test User")
                .role(UserRole.STUDENT)
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(jwtService.generateToken(existingUser)).thenReturn("jwt-token-login");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt-token-login", response.getToken());
        assertEquals("user-123", response.getUserId());
        assertEquals("test@example.com", response.getEmail());
        assertEquals("Test User", response.getDisplayName());
        assertEquals("STUDENT", response.getRole());
    }

    @Test
    void login_wrongPassword_throwsRuntimeException() {
        LoginRequest request = new LoginRequest("test@example.com", "wrongPassword");

        User existingUser = User.builder()
                .id("user-123")
                .email("test@example.com")
                .password("encodedPassword")
                .displayName("Test User")
                .role(UserRole.STUDENT)
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.login(request));
        assertEquals("Invalid email or password", exception.getMessage());
    }

    @Test
    void login_userNotFound_throwsRuntimeException() {
        LoginRequest request = new LoginRequest("nonexistent@example.com", "password123");

        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.login(request));
        assertEquals("Invalid email or password", exception.getMessage());
    }

    @Test
    void login_nullPassword_googleUser_throwsRuntimeException() {
        LoginRequest request = new LoginRequest("google@example.com", "anyPassword");

        User googleUser = User.builder()
                .id("user-google")
                .email("google@example.com")
                .password(null)
                .displayName("Google User")
                .role(UserRole.STUDENT)
                .authProvider("GOOGLE")
                .build();

        when(userRepository.findByEmail("google@example.com")).thenReturn(Optional.of(googleUser));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.login(request));
        assertEquals("Invalid email or password", exception.getMessage());
    }

    // --- loginWithGoogle tests ---

    @Test
    void loginWithGoogle_invalidToken_throwsRuntimeException() {
        // The GoogleIdTokenVerifier is created inside the method, so passing a garbage token
        // will cause verification to fail, resulting in RuntimeException.
        assertThrows(RuntimeException.class,
                () -> authService.loginWithGoogle("garbage-token-that-will-not-verify"));
    }

    @Test
    void loginWithGoogle_nullToken_throwsRuntimeException() {
        assertThrows(RuntimeException.class,
                () -> authService.loginWithGoogle(null));
    }
}
