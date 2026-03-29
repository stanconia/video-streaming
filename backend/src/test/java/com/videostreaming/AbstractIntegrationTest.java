package com.videostreaming;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.videostreaming.auth.service.JwtService;
import com.videostreaming.payment.service.StripePaymentGateway;
import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import com.videostreaming.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
public abstract class AbstractIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected JwtService jwtService;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    // Mock external API gateways
    @MockBean
    protected StripePaymentGateway stripePaymentGateway;

    /**
     * Creates a real User in H2 and returns a valid JWT token.
     */
    protected String createUserAndGetToken(String email, String displayName, UserRole role) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode("Password123!"))
                .displayName(displayName)
                .role(role)
                .build();
        user = userRepository.save(user);
        return jwtService.generateToken(user);
    }

    protected String createUserAndGetToken(String email, String displayName, UserRole role, String password) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .displayName(displayName)
                .role(role)
                .build();
        user = userRepository.save(user);
        return jwtService.generateToken(user);
    }

    protected User createUser(String email, String displayName, UserRole role) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode("Password123!"))
                .displayName(displayName)
                .role(role)
                .build();
        return userRepository.save(user);
    }

    protected String getToken(User user) {
        return jwtService.generateToken(user);
    }

    protected String authHeader(String token) {
        return "Bearer " + token;
    }
}
