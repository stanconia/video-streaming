# Platform Improvements Roadmap

Prioritized list of improvements for the EduLive video streaming education platform.

## Status Legend
- [x] Implemented
- [ ] Not started

---

## Critical (Security - Fix Before Production)

- [x] **1. Input Validation** — Add Jakarta Bean Validation (`@Valid`, `@NotBlank`, `@Email`, `@Size`, `@Min`) to all API request DTOs and controllers
- [x] **2. Global Exception Handler** — `@RestControllerAdvice` with consistent error response format, proper HTTP status codes
- [x] **3. Rate Limiting** — IP-based rate limiting: 60 req/min general, 10 req/min for auth endpoints
- [x] **4. Fix SecurityConfig** — Change `anyRequest().permitAll()` to `anyRequest().denyAll()`
- [x] **5. WebSocket CORS** — Replace `setAllowedOrigins("*")` with `setAllowedOriginPatterns("*")`

---

## High Priority (Next Sprint)

- [ ] **6. Redis Caching** — Add `@Cacheable` to course listings, teacher profiles, search results. Redis is configured but unused.
  - Files: All service classes in `backend/src/main/java/com/videostreaming/*/service/`
  - Effort: Medium (2-3 days)
  - Notes: Add `@EnableCaching` to config, add `@Cacheable("courses")` to frequently accessed methods

- [ ] **7. API Documentation (Swagger/OpenAPI)** — Add springdoc-openapi for auto-generated API docs
  - Add dependency: `org.springdoc:springdoc-openapi-starter-webmvc-ui:2.3.0`
  - Add `@Operation`, `@Tag` annotations to controllers
  - Effort: Medium (2 days)

- [x] **8. Password Reset Flow** — Forgot password email, reset token, new password form
- [x] **9. Recording Playback (VOD)** — Fixed FFmpeg in media server, improved playback UI with retry/status
- [ ] **10. Increase Test Coverage** — Currently 14 frontend test files for 100+ components
  - Priority areas: Payment flow, messaging, calendar, teacher dashboard
  - Target: 60%+ coverage
  - Effort: Large (1-2 weeks)

---

## Medium Priority (Upcoming Sprints)

- [ ] **11. Lazy Loading Routes** — Use `React.lazy()` for route-level code splitting
  - File: `frontend/src/App.tsx`
  - Effort: Small (1 day)
  - Impact: Faster initial page load

- [x] **12. Student Progress Tracking** — Lesson completion, quiz scores, progress percentage per course
- [ ] **13. Video Transcription/Captions** — Use Whisper model for auto-generated subtitles on recordings
  - New service: TranscriptionService calling Whisper API
  - Store captions as WebVTT files in S3
  - Add `<track>` element to PlaybackPage video player
  - Effort: Large (1 week)

- [ ] **14. Adaptive Bitrate Streaming** — Single quality stream currently. Add quality selector.
  - Media server: Produce multiple quality layers (simulcast)
  - Frontend: Quality picker in video controls
  - Effort: Large (1 week)

- [x] **15. Advanced Search** — Price range, difficulty, rating, sort options in search UI

- [ ] **16. Refund Management UI** — Stripe refunds exist in backend but no admin/teacher UI
  - New component: `frontend/src/components/Payment/RefundManager.tsx`
  - Backend: Add refund endpoints to PaymentController
  - Effort: Medium (2-3 days)

- [ ] **17. Mobile Responsiveness** — Only 2 CSS breakpoints. Need 4-5 for tablets and small screens.
  - File: `frontend/src/styles/responsive.css`
  - Add breakpoints: 480px, 640px, 768px, 1024px, 1280px
  - Effort: Medium (3 days)

- [ ] **18. Accessibility (WCAG 2.1 AA)** — No ARIA labels, alt text inconsistent, forms not screen-reader friendly
  - Add `aria-label`, `role`, `aria-describedby` to all interactive elements
  - Add skip navigation link
  - Ensure color contrast meets AA standard
  - Effort: Large (1 week)

- [ ] **19. Structured Logging** — No JSON logs, no correlation IDs
  - Add `logback-json` encoder
  - Add MDC filter for request correlation IDs
  - Filter PII from logs
  - Effort: Medium (2 days)

- [ ] **20. Database Indexes** — No index hints in JPA. Course search does full table scans.
  - Add `@Index` on: Course.subject, Course.teacherUserId, Enrollment.userId, Lesson.courseId
  - Effort: Small (1 day)

---

## Nice to Have (Polish)

- [ ] **21. Dark Mode Toggle** — App is dark in live sessions but light elsewhere
  - Add ThemeContext, persist preference in localStorage
  - Effort: Medium (2-3 days)

- [ ] **22. Content Recommendations** — "Students also enrolled in..." based on enrollment data
  - New service: RecommendationService with collaborative filtering
  - Effort: Large (1 week)

- [x] **23. Branded HTML Email Templates** — Professional HTML emails for notifications
- [ ] **24. Multi-language (i18n)** — English only currently
  - Add react-intl, extract all strings to message files
  - Effort: Large (2 weeks for full coverage)

- [ ] **25. PWA/Offline** — No service worker. Allow offline access to downloaded content.
  - Add service worker, manifest.json, offline cache strategy
  - Effort: Medium (3 days)

- [ ] **26. Analytics Dashboard** — No engagement metrics
  - Track: video watch time, quiz completion rates, course drop-off points
  - New module: `backend/src/main/java/com/videostreaming/analytics/`
  - Frontend: Charts with recharts or chart.js
  - Effort: Large (2 weeks)

- [ ] **27. 2FA/MFA** — No two-factor authentication
  - TOTP-based (Google Authenticator compatible)
  - Add `totpSecret` field to User entity
  - New endpoints: enable-2fa, verify-2fa, disable-2fa
  - Effort: Medium (3 days)

- [ ] **28. LMS Integration** — No Canvas/Blackboard/Moodle integration
  - Implement LTI 1.3 provider
  - Allow course import/export
  - Effort: Very Large (3-4 weeks)

---

## Architecture Improvements

- [ ] **API Versioning** — No versioning. Add `/api/v1/` prefix.
- [ ] **Circuit Breakers** — No resilience patterns for external services (Stripe, Ollama, media server)
  - Add Resilience4j with fallbacks
- [ ] **Distributed Tracing** — Add OpenTelemetry for cross-service tracing
- [ ] **Audit Logging** — Track all data mutations (who changed what, when)
- [ ] **Security Scanning** — Add OWASP dependency check and Snyk to CI pipeline
- [ ] **Database Migrations** — Currently using `ddl-auto: create-drop`. Switch to Flyway/Liquibase.
- [ ] **Environment Separation** — Hardcoded values in deploy.sh. Use separate configs per environment.

---

## Known Technical Debt

| Issue | File | Severity |
|-------|------|----------|
| `Double` used for money instead of `BigDecimal` | ScheduledClass.java | Medium |
| No foreign key constraints in JPA entities | All model classes | Medium |
| Recording files never cleaned up from /tmp after S3 upload | RecordingSession.ts | Medium |
| Redis configured but `@Cacheable` never used | application.yml | Low |
| No unique constraint on user email in DB | User.java | High |
| SignalingWebSocketHandler is 1600+ lines | SignalingWebSocketHandler.java | Medium |
| Console.log statements in production frontend | Multiple hooks | Low |
