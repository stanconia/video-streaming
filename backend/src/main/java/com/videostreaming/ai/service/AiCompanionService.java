package com.videostreaming.ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiCompanionService {

    private static final Logger logger = LoggerFactory.getLogger(AiCompanionService.class);
    private static final int MAX_CONTEXT_MESSAGES = 20;

    private static final String CHAT_SYSTEM_PROMPT =
            "You are an AI teaching assistant in a live class session. " +
            "You help students and teachers by answering questions, clarifying concepts, and providing helpful information. " +
            "Keep responses concise (2-4 sentences) and educational. " +
            "If you don't know something, say so honestly. " +
            "Here is the recent chat context from the session:";

    private static final String SUMMARY_SYSTEM_PROMPT =
            "You are an AI assistant that summarizes live class sessions. " +
            "Given the chat history of a live session, provide:\n" +
            "1. A concise summary (3-5 sentences) of what was discussed\n" +
            "2. Key points as a bullet list (3-7 items)\n" +
            "3. Any action items or follow-ups mentioned\n\n" +
            "Format your response as:\n" +
            "## Summary\n[summary text]\n\n## Key Points\n- point 1\n- point 2\n...\n\n## Action Items\n- item 1\n...";

    private final OllamaClient ollamaClient;

    public AiCompanionService(OllamaClient ollamaClient) {
        this.ollamaClient = ollamaClient;
    }

    /**
     * Handle a live chat question. Returns streaming token chunks.
     */
    public Flux<String> handleChatQuestion(String question, List<Map<String, Object>> recentHistory) {
        logger.info("AI chat question: {}", question);

        // Build context from recent messages
        List<Map<String, String>> messages = buildChatContext(recentHistory);
        messages.add(Map.of("role", "user", "content", question));

        return ollamaClient.chatStream(CHAT_SYSTEM_PROMPT, messages);
    }

    /**
     * Generate a session summary. Returns the full summary.
     */
    public Mono<String> generateSummary(List<Map<String, Object>> chatHistory) {
        logger.info("Generating session summary from {} messages", chatHistory.size());

        if (chatHistory.isEmpty()) {
            return Mono.just("No chat messages to summarize.");
        }

        String historyText = chatHistory.stream()
                .map(msg -> String.format("[%s] %s: %s",
                        msg.getOrDefault("senderRole", "viewer"),
                        msg.getOrDefault("senderName", "Unknown"),
                        msg.getOrDefault("content", "")))
                .collect(Collectors.joining("\n"));

        List<Map<String, String>> messages = List.of(
                Map.of("role", "user", "content", "Here is the chat history:\n\n" + historyText + "\n\nPlease summarize this session.")
        );

        return ollamaClient.chat(SUMMARY_SYSTEM_PROMPT, messages);
    }

    /**
     * Check if the AI service is available.
     */
    public Mono<Boolean> isAvailable() {
        return ollamaClient.isAvailable();
    }

    private List<Map<String, String>> buildChatContext(List<Map<String, Object>> history) {
        // Take last N messages as context
        int start = Math.max(0, history.size() - MAX_CONTEXT_MESSAGES);
        List<Map<String, Object>> recent = history.subList(start, history.size());

        return recent.stream()
                .map(msg -> Map.of(
                        "role", "user",
                        "content", String.format("[%s (%s)]: %s",
                                msg.getOrDefault("senderName", "Unknown"),
                                msg.getOrDefault("senderRole", "viewer"),
                                msg.getOrDefault("content", ""))
                ))
                .collect(Collectors.toCollection(java.util.ArrayList::new));
    }
}
