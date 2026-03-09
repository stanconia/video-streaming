package com.videostreaming.notification.service;

import java.util.Map;

public interface EmailService {
    void sendEmail(String to, String subject, String body);
    void sendTemplatedEmail(String to, String template, Map<String, String> variables);
}
