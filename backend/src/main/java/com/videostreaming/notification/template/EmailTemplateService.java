package com.videostreaming.notification.template;

import org.springframework.stereotype.Service;

@Service
public class EmailTemplateService {

    private static final String ACCENT_COLOR = "#8b5cf6";
    private static final String ACCENT_DARK = "#0d9488";
    private static final String BG_COLOR = "#f3f4f6";
    private static final String CARD_BG = "#ffffff";
    private static final String TEXT_COLOR = "#1f2937";
    private static final String TEXT_MUTED = "#6b7280";
    private static final String FOOTER_BG = "#111827";
    private static final String FOOTER_TEXT = "#9ca3af";

    public String enrollmentConfirmation(String studentName, String courseName, String courseUrl) {
        String content = "<h2 style=\"color: " + TEXT_COLOR + "; margin: 0 0 8px 0; font-size: 22px;\">You're Enrolled!</h2>"
                + "<p style=\"color: " + TEXT_MUTED + "; font-size: 16px; margin: 0 0 24px 0;\">Congratulations on taking the next step in your learning journey.</p>"
                + "<div style=\"background-color: " + BG_COLOR + "; border-radius: 8px; padding: 20px; margin-bottom: 24px;\">"
                + "  <p style=\"margin: 0 0 4px 0; font-size: 13px; color: " + TEXT_MUTED + "; text-transform: uppercase; letter-spacing: 0.05em;\">Course</p>"
                + "  <p style=\"margin: 0; font-size: 18px; font-weight: bold; color: " + TEXT_COLOR + ";\">" + escapeHtml(courseName) + "</p>"
                + "</div>"
                + "<p style=\"color: " + TEXT_COLOR + "; font-size: 15px; line-height: 1.6;\">"
                + "  Hi " + escapeHtml(studentName) + ", you now have full access to all course materials including lessons, quizzes, and assignments. "
                + "  Start learning at your own pace."
                + "</p>"
                + buildButton("Start Learning", courseUrl != null ? courseUrl : "#");

        return wrapLayout(content);
    }

    public String sessionReminder(String studentName, String sessionTitle, String scheduledTime, String joinUrl) {
        String content = "<h2 style=\"color: " + TEXT_COLOR + "; margin: 0 0 8px 0; font-size: 22px;\">Live Session Reminder</h2>"
                + "<p style=\"color: " + TEXT_MUTED + "; font-size: 16px; margin: 0 0 24px 0;\">Don't miss your upcoming live session.</p>"
                + "<div style=\"background-color: " + BG_COLOR + "; border-radius: 8px; padding: 20px; margin-bottom: 24px;\">"
                + "  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\">"
                + "    <tr>"
                + "      <td style=\"padding: 6px 0; font-size: 13px; color: " + TEXT_MUTED + "; width: 100px;\">Session</td>"
                + "      <td style=\"padding: 6px 0; font-size: 15px; color: " + TEXT_COLOR + "; font-weight: bold;\">" + escapeHtml(sessionTitle) + "</td>"
                + "    </tr>"
                + "    <tr>"
                + "      <td style=\"padding: 6px 0; font-size: 13px; color: " + TEXT_MUTED + ";\">When</td>"
                + "      <td style=\"padding: 6px 0; font-size: 15px; color: " + TEXT_COLOR + ";\">" + escapeHtml(scheduledTime) + "</td>"
                + "    </tr>"
                + "  </table>"
                + "</div>"
                + "<p style=\"color: " + TEXT_COLOR + "; font-size: 15px; line-height: 1.6;\">"
                + "  Hi " + escapeHtml(studentName) + ", your live session is coming up soon. Make sure you're ready to join on time."
                + "</p>"
                + buildButton("Join Session", joinUrl != null ? joinUrl : "#");

        return wrapLayout(content);
    }

    public String welcomeEmail(String userName) {
        String content = "<h2 style=\"color: " + TEXT_COLOR + "; margin: 0 0 8px 0; font-size: 22px;\">Welcome to EduLive!</h2>"
                + "<p style=\"color: " + TEXT_MUTED + "; font-size: 16px; margin: 0 0 24px 0;\">We're excited to have you on board.</p>"
                + "<p style=\"color: " + TEXT_COLOR + "; font-size: 15px; line-height: 1.6;\">"
                + "  Hi " + escapeHtml(userName) + ", welcome to EduLive! Your account has been created successfully."
                + "</p>"
                + "<p style=\"color: " + TEXT_COLOR + "; font-size: 15px; line-height: 1.6; margin-bottom: 24px;\">"
                + "  Here's what you can do:"
                + "</p>"
                + "<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"margin-bottom: 24px;\">"
                + "  <tr>"
                + "    <td style=\"padding: 12px 16px; background-color: " + BG_COLOR + "; border-radius: 8px; margin-bottom: 8px;\">"
                + "      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\">"
                + "        <tr>"
                + "          <td width=\"40\" style=\"font-size: 24px; text-align: center; vertical-align: top;\">&#x1F4DA;</td>"
                + "          <td style=\"padding-left: 12px;\">"
                + "            <p style=\"margin: 0 0 2px 0; font-weight: bold; color: " + TEXT_COLOR + "; font-size: 14px;\">Browse Courses</p>"
                + "            <p style=\"margin: 0; color: " + TEXT_MUTED + "; font-size: 13px;\">Explore hundreds of courses from expert teachers.</p>"
                + "          </td>"
                + "        </tr>"
                + "      </table>"
                + "    </td>"
                + "  </tr>"
                + "  <tr><td style=\"height: 8px;\"></td></tr>"
                + "  <tr>"
                + "    <td style=\"padding: 12px 16px; background-color: " + BG_COLOR + "; border-radius: 8px; margin-bottom: 8px;\">"
                + "      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\">"
                + "        <tr>"
                + "          <td width=\"40\" style=\"font-size: 24px; text-align: center; vertical-align: top;\">&#x1F3AC;</td>"
                + "          <td style=\"padding-left: 12px;\">"
                + "            <p style=\"margin: 0 0 2px 0; font-weight: bold; color: " + TEXT_COLOR + "; font-size: 14px;\">Join Live Sessions</p>"
                + "            <p style=\"margin: 0; color: " + TEXT_MUTED + "; font-size: 13px;\">Participate in real-time with teachers and classmates.</p>"
                + "          </td>"
                + "        </tr>"
                + "      </table>"
                + "    </td>"
                + "  </tr>"
                + "  <tr><td style=\"height: 8px;\"></td></tr>"
                + "  <tr>"
                + "    <td style=\"padding: 12px 16px; background-color: " + BG_COLOR + "; border-radius: 8px;\">"
                + "      <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\">"
                + "        <tr>"
                + "          <td width=\"40\" style=\"font-size: 24px; text-align: center; vertical-align: top;\">&#x1F393;</td>"
                + "          <td style=\"padding-left: 12px;\">"
                + "            <p style=\"margin: 0 0 2px 0; font-weight: bold; color: " + TEXT_COLOR + "; font-size: 14px;\">Earn Certificates</p>"
                + "            <p style=\"margin: 0; color: " + TEXT_MUTED + "; font-size: 13px;\">Complete courses and showcase your achievements.</p>"
                + "          </td>"
                + "        </tr>"
                + "      </table>"
                + "    </td>"
                + "  </tr>"
                + "</table>"
                + buildButton("Explore Courses", "#");

        return wrapLayout(content);
    }

    public String passwordReset(String userName, String resetUrl) {
        String content = "<h2 style=\"color: " + TEXT_COLOR + "; margin: 0 0 8px 0; font-size: 22px;\">Reset Your Password</h2>"
                + "<p style=\"color: " + TEXT_MUTED + "; font-size: 16px; margin: 0 0 24px 0;\">We received a request to reset your password.</p>"
                + "<p style=\"color: " + TEXT_COLOR + "; font-size: 15px; line-height: 1.6;\">"
                + "  Hi " + escapeHtml(userName) + ", click the button below to set a new password. This link will expire in 1 hour."
                + "</p>"
                + buildButton("Reset Password", resetUrl != null ? resetUrl : "#")
                + "<p style=\"color: " + TEXT_MUTED + "; font-size: 13px; line-height: 1.5; margin-top: 24px;\">"
                + "  If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged."
                + "</p>"
                + "<p style=\"color: " + TEXT_MUTED + "; font-size: 12px; line-height: 1.5; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;\">"
                + "  If the button doesn't work, copy and paste this URL into your browser:<br>"
                + "  <span style=\"color: " + ACCENT_COLOR + "; word-break: break-all;\">" + escapeHtml(resetUrl != null ? resetUrl : "#") + "</span>"
                + "</p>";

        return wrapLayout(content);
    }

    // --- Layout helpers ---

    private String wrapLayout(String bodyContent) {
        return "<!DOCTYPE html>"
                + "<html lang=\"en\">"
                + "<head>"
                + "  <meta charset=\"UTF-8\">"
                + "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                + "  <title>EduLive</title>"
                + "</head>"
                + "<body style=\"margin: 0; padding: 0; background-color: " + BG_COLOR + "; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\">"
                + "  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"background-color: " + BG_COLOR + ";\">"
                + "    <tr>"
                + "      <td align=\"center\" style=\"padding: 40px 20px;\">"
                + "        <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"600\" style=\"max-width: 600px;\">"
                // Header
                + "          <tr>"
                + "            <td style=\"background: linear-gradient(135deg, " + ACCENT_COLOR + " 0%, " + ACCENT_DARK + " 100%); "
                + "                        background-color: " + ACCENT_COLOR + "; padding: 28px 32px; border-radius: 12px 12px 0 0; text-align: center;\">"
                + "              <h1 style=\"margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;\">EduLive</h1>"
                + "              <p style=\"margin: 6px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px; letter-spacing: 0.5px;\">Live Learning Platform</p>"
                + "            </td>"
                + "          </tr>"
                // Content
                + "          <tr>"
                + "            <td style=\"background-color: " + CARD_BG + "; padding: 32px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;\">"
                + bodyContent
                + "            </td>"
                + "          </tr>"
                // Footer
                + "          <tr>"
                + "            <td style=\"background-color: " + FOOTER_BG + "; padding: 24px 32px; border-radius: 0 0 12px 12px; text-align: center;\">"
                + "              <p style=\"margin: 0 0 8px 0; color: #ffffff; font-size: 14px; font-weight: bold;\">EduLive</p>"
                + "              <p style=\"margin: 0 0 12px 0; color: " + FOOTER_TEXT + "; font-size: 12px;\">Live Learning Platform</p>"
                + "              <p style=\"margin: 0; font-size: 11px;\">"
                + "                <a href=\"#\" style=\"color: " + FOOTER_TEXT + "; text-decoration: underline;\">Unsubscribe</a>"
                + "                <span style=\"color: " + FOOTER_TEXT + "; margin: 0 8px;\">|</span>"
                + "                <a href=\"#\" style=\"color: " + FOOTER_TEXT + "; text-decoration: underline;\">Privacy Policy</a>"
                + "              </p>"
                + "            </td>"
                + "          </tr>"
                + "        </table>"
                + "      </td>"
                + "    </tr>"
                + "  </table>"
                + "</body>"
                + "</html>";
    }

    private String buildButton(String label, String url) {
        return "<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"margin-top: 24px;\">"
                + "  <tr>"
                + "    <td align=\"center\">"
                + "      <a href=\"" + escapeHtml(url) + "\" style=\"display: inline-block; padding: 14px 32px; "
                + "         background-color: " + ACCENT_COLOR + "; color: #ffffff; text-decoration: none; "
                + "         border-radius: 8px; font-size: 15px; font-weight: bold; letter-spacing: 0.02em;\">"
                + escapeHtml(label)
                + "      </a>"
                + "    </td>"
                + "  </tr>"
                + "</table>";
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
