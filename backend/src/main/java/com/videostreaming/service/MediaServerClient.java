package com.videostreaming.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
public class MediaServerClient {

    private static final Logger logger = LoggerFactory.getLogger(MediaServerClient.class);

    private final WebClient webClient;

    public MediaServerClient(@Value("${media-server.url}") String mediaServerUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(mediaServerUrl)
                .build();
    }

    public String forwardSignalingMessage(String message, String sessionId) {
        try {
            logger.debug("Forwarding signaling message to media server for session {}", sessionId);

            String response = webClient.post()
                    .uri("/signaling")
                    .header("X-Session-Id", sessionId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(message.getBytes())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            logger.info("Received response from media server: {}", response);
            return response;

        } catch (Exception e) {
            logger.error("Error forwarding message to media server: {}", e.getMessage(), e);
            return createErrorResponse("Failed to communicate with media server: " + e.getMessage());
        }
    }

    private String createErrorResponse(String errorMessage) {
        return String.format("{\"type\":\"error\",\"message\":\"%s\"}", errorMessage);
    }
}
