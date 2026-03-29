package com.videostreaming.ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class OllamaClient {

    private static final Logger logger = LoggerFactory.getLogger(OllamaClient.class);

    private final WebClient webClient;
    private final String model;
    private final int timeoutSeconds;

    public OllamaClient(
            @Value("${ollama.url:http://localhost:11434}") String ollamaUrl,
            @Value("${ollama.model:llama3.1:8b-instruct-q4_0}") String model,
            @Value("${ollama.timeout-seconds:60}") int timeoutSeconds) {
        this.webClient = WebClient.builder().baseUrl(ollamaUrl).build();
        this.model = model;
        this.timeoutSeconds = timeoutSeconds;
        logger.info("OllamaClient initialized: url={}, model={}", ollamaUrl, model);
    }

    /**
     * Streaming chat completion. Returns a Flux of token chunks.
     */
    public Flux<String> chatStream(String systemPrompt, List<Map<String, String>> messages) {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", buildMessages(systemPrompt, messages),
                "stream", true
        );

        return webClient.post()
                .uri("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(String.class)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .map(this::extractContent)
                .filter(s -> !s.isEmpty())
                .onErrorResume(e -> {
                    logger.error("Ollama streaming error: {}", e.getMessage());
                    return Flux.just("[AI error: " + e.getMessage() + "]");
                });
    }

    /**
     * Single-shot chat completion (for summaries). Returns the full response.
     */
    public Mono<String> chat(String systemPrompt, List<Map<String, String>> messages) {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", buildMessages(systemPrompt, messages),
                "stream", false
        );

        return webClient.post()
                .uri("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .map(this::extractFullContent)
                .onErrorResume(e -> {
                    logger.error("Ollama chat error: {}", e.getMessage());
                    return Mono.just("[AI error: " + e.getMessage() + "]");
                });
    }

    /**
     * Check if Ollama is available and the model is loaded.
     */
    public Mono<Boolean> isAvailable() {
        return webClient.get()
                .uri("/api/tags")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(5))
                .map(response -> response.contains(model.split(":")[0]))
                .onErrorReturn(false);
    }

    private List<Map<String, String>> buildMessages(String systemPrompt, List<Map<String, String>> userMessages) {
        var allMessages = new java.util.ArrayList<Map<String, String>>();
        allMessages.add(Map.of("role", "system", "content", systemPrompt));
        allMessages.addAll(userMessages);
        return allMessages;
    }

    private String extractContent(String jsonLine) {
        try {
            var node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(jsonLine);
            if (node.has("message") && node.get("message").has("content")) {
                return node.get("message").get("content").asText("");
            }
            return "";
        } catch (Exception e) {
            return "";
        }
    }

    private String extractFullContent(String json) {
        try {
            var node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(json);
            if (node.has("message") && node.get("message").has("content")) {
                return node.get("message").get("content").asText("");
            }
            return "[No response from AI]";
        } catch (Exception e) {
            logger.error("Failed to parse Ollama response: {}", e.getMessage());
            return "[Failed to parse AI response]";
        }
    }
}
