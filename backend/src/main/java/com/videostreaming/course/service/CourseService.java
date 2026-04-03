package com.videostreaming.course.service;

import com.videostreaming.shared.service.S3Service;
import com.videostreaming.user.model.*;
import com.videostreaming.course.model.*;
import com.videostreaming.live.model.*;
import com.videostreaming.teacher.model.*;
import com.videostreaming.scheduling.model.*;
import com.videostreaming.notification.model.*;
import com.videostreaming.payment.model.*;
import com.videostreaming.review.model.*;
import com.videostreaming.quiz.model.*;
import com.videostreaming.assignment.model.*;
import com.videostreaming.discussion.model.*;
import com.videostreaming.messaging.model.*;
import com.videostreaming.certificate.model.*;
import com.videostreaming.course.dto.*;
import com.videostreaming.live.dto.*;
import com.videostreaming.admin.dto.*;
import com.videostreaming.teacher.dto.*;
import com.videostreaming.scheduling.dto.*;
import com.videostreaming.notification.dto.*;
import com.videostreaming.payment.dto.*;
import com.videostreaming.review.dto.*;
import com.videostreaming.quiz.dto.*;
import com.videostreaming.assignment.dto.*;
import com.videostreaming.discussion.dto.*;
import com.videostreaming.messaging.dto.*;
import com.videostreaming.certificate.dto.*;
import com.videostreaming.user.dto.*;
import com.videostreaming.auth.dto.*;
import com.videostreaming.user.repository.*;
import com.videostreaming.course.repository.*;
import com.videostreaming.live.repository.*;
import com.videostreaming.teacher.repository.*;
import com.videostreaming.scheduling.repository.*;
import com.videostreaming.notification.repository.*;
import com.videostreaming.payment.repository.*;
import com.videostreaming.review.repository.*;
import com.videostreaming.quiz.repository.*;
import com.videostreaming.assignment.repository.*;
import com.videostreaming.discussion.repository.*;
import com.videostreaming.messaging.repository.*;
import com.videostreaming.certificate.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private static final Logger logger = LoggerFactory.getLogger(CourseService.class);

    private final CourseRepository courseRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final LessonRepository lessonRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final LiveSessionRepository liveSessionRepository;
    private final S3Service s3Service;

    public CourseService(CourseRepository courseRepository,
                         CourseModuleRepository courseModuleRepository,
                         LessonRepository lessonRepository,
                         CourseEnrollmentRepository courseEnrollmentRepository,
                         UserRepository userRepository,
                         ReviewRepository reviewRepository,
                         TeacherProfileRepository teacherProfileRepository,
                         LiveSessionRepository liveSessionRepository,
                         S3Service s3Service) {
        this.courseRepository = courseRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.lessonRepository = lessonRepository;
        this.courseEnrollmentRepository = courseEnrollmentRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.liveSessionRepository = liveSessionRepository;
        this.s3Service = s3Service;
    }

    @Transactional
    public CourseResponse createCourse(String teacherUserId, CreateCourseRequest request) {
        Course course = Course.builder()
                .teacherUserId(teacherUserId)
                .title(request.getTitle())
                .description(request.getDescription())
                .subject(request.getSubject())
                .price(request.getPrice())
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .thumbnailUrl(request.getThumbnailUrl())
                .difficultyLevel(request.getDifficultyLevel() != null
                        ? DifficultyLevel.valueOf(request.getDifficultyLevel()) : null)
                .estimatedHours(request.getEstimatedHours())
                .minAge(request.getMinAge())
                .maxAge(request.getMaxAge())
                .tags(request.getTags())
                .build();

        course = courseRepository.save(course);
        logger.info("Course '{}' created by teacher {}", course.getTitle(), teacherUserId);
        return toCourseResponse(course);
    }

    @Transactional
    public CourseResponse updateCourse(String courseId, String teacherUserId, CreateCourseRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only update your own courses");
        }

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setSubject(request.getSubject());
        course.setPrice(request.getPrice());
        if (request.getCurrency() != null) {
            course.setCurrency(request.getCurrency());
        }
        course.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getDifficultyLevel() != null) {
            course.setDifficultyLevel(DifficultyLevel.valueOf(request.getDifficultyLevel()));
        }
        course.setEstimatedHours(request.getEstimatedHours());
        course.setMinAge(request.getMinAge());
        course.setMaxAge(request.getMaxAge());
        course.setTags(request.getTags());

        course = courseRepository.save(course);
        logger.info("Course '{}' updated by teacher {}", course.getTitle(), teacherUserId);
        return toCourseResponse(course);
    }

    @Transactional
    public CourseResponse publishCourse(String courseId, String teacherUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only publish your own courses");
        }

        course.setPublished(!course.isPublished());
        course = courseRepository.save(course);
        logger.info("Course '{}' {} by teacher {}", course.getTitle(), course.isPublished() ? "published" : "unpublished", teacherUserId);
        return toCourseResponse(course);
    }

    public CourseResponse getCourse(String courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        return toCourseResponse(course);
    }

    public List<CourseResponse> getCourses() {
        return courseRepository.findByPublishedTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::toCourseResponse)
                .collect(Collectors.toList());
    }

    public List<CourseResponse> getTeacherCourses(String teacherUserId) {
        return courseRepository.findByTeacherUserIdOrderByCreatedAtDesc(teacherUserId)
                .stream()
                .map(this::toCourseResponse)
                .collect(Collectors.toList());
    }

    public List<String> getSubjects() {
        return courseRepository.findAllDistinctSubjects();
    }

    public CourseSearchResponse searchCourses(String query, String subject, String difficulty,
                                               BigDecimal minPrice, BigDecimal maxPrice,
                                               String sortBy, Integer minRating,
                                               String country, String userId,
                                               int page, int size) {
        Sort sort = buildSort(sortBy);
        PageRequest pageable = PageRequest.of(page, size, sort);

        Page<Course> coursePage = courseRepository.searchCourses(
                query != null ? query : "", subject != null ? subject : "",
                difficulty != null ? difficulty : "", minPrice, maxPrice, pageable);

        List<CourseResponse> courses = coursePage.getContent()
                .stream()
                .map(this::toCourseResponse)
                .collect(Collectors.toList());

        // Apply country filter: keep only courses where teacher's country matches
        if (country != null && !country.isBlank()) {
            courses = courses.stream()
                    .filter(c -> {
                        String teacherCountry = getTeacherCountry(c.getTeacherUserId());
                        return country.equalsIgnoreCase(teacherCountry);
                    })
                    .collect(Collectors.toList());
        }

        // Apply minRating filter in-memory (averageRating is computed, not a DB column)
        if (minRating != null && minRating > 0) {
            final int ratingThreshold = minRating;
            courses = courses.stream()
                    .filter(c -> c.getAverageRating() != null && c.getAverageRating() >= ratingThreshold)
                    .collect(Collectors.toList());
        }

        // Apply "popular" sort in-memory (enrolledCount is computed, not a DB column)
        if ("popular".equals(sortBy)) {
            courses = courses.stream()
                    .sorted((a, b) -> Integer.compare(b.getEnrolledCount(), a.getEnrolledCount()))
                    .collect(Collectors.toList());
        }

        // Apply personalized ranking if an authenticated user is provided
        if (userId != null && !userId.isBlank()) {
            courses = applyPersonalizedRanking(courses, userId);
        }

        return new CourseSearchResponse(
                courses,
                coursePage.getNumber(),
                coursePage.getSize(),
                coursePage.getTotalElements(),
                coursePage.getTotalPages(),
                coursePage.hasNext(),
                coursePage.hasPrevious());
    }

    /**
     * Parse country from a location string formatted as "City, Country".
     */
    private String parseCountryFromLocation(String location) {
        if (location == null || location.isBlank()) {
            return null;
        }
        String trimmed = location.trim();
        int lastComma = trimmed.lastIndexOf(',');
        if (lastComma >= 0 && lastComma < trimmed.length() - 1) {
            return trimmed.substring(lastComma + 1).trim();
        }
        // If no comma, treat the whole string as the country
        return trimmed;
    }

    /**
     * Get the country portion of a teacher's location.
     */
    private String getTeacherCountry(String teacherUserId) {
        return userRepository.findById(teacherUserId)
                .map(user -> parseCountryFromLocation(user.getLocation()))
                .orElse(null);
    }

    /**
     * Re-sort the current page of courses based on personalized relevance scoring.
     * +2 if the teacher's country matches the user's country
     * +1 for each matching subject interest
     * Results are sorted by score descending, preserving original order for ties.
     */
    private List<CourseResponse> applyPersonalizedRanking(List<CourseResponse> courses, String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return courses;
        }
        User user = userOpt.get();
        String userCountry = parseCountryFromLocation(user.getLocation());
        Set<String> userInterests = new HashSet<>();
        if (user.getSubjectInterests() != null && !user.getSubjectInterests().isBlank()) {
            for (String interest : user.getSubjectInterests().split(",")) {
                userInterests.add(interest.trim().toLowerCase());
            }
        }

        // If there's nothing to personalize on, skip
        if (userCountry == null && userInterests.isEmpty()) {
            return courses;
        }

        // Cache teacher countries to avoid repeated DB lookups
        Map<String, String> teacherCountryCache = new HashMap<>();

        // Build scored list preserving original index for stable sort
        List<CourseResponse> scored = new ArrayList<>(courses);
        Map<CourseResponse, Integer> scoreMap = new HashMap<>();

        for (CourseResponse course : scored) {
            int score = 0;

            // Country match: +2
            if (userCountry != null) {
                String teacherCountry = teacherCountryCache.computeIfAbsent(
                        course.getTeacherUserId(), this::getTeacherCountry);
                if (userCountry.equalsIgnoreCase(teacherCountry)) {
                    score += 2;
                }
            }

            // Subject interest match: +1 per matching interest
            if (!userInterests.isEmpty() && course.getSubject() != null) {
                if (userInterests.contains(course.getSubject().toLowerCase())) {
                    score += 1;
                }
            }

            scoreMap.put(course, score);
        }

        // Stable sort by score descending (preserves existing order for equal scores)
        scored.sort((a, b) -> Integer.compare(scoreMap.getOrDefault(b, 0), scoreMap.getOrDefault(a, 0)));
        return scored;
    }

    private Sort buildSort(String sortBy) {
        if (sortBy == null || sortBy.isEmpty()) {
            return Sort.by(Sort.Direction.DESC, "created_at");
        }
        switch (sortBy) {
            case "price_asc":
                return Sort.by(Sort.Direction.ASC, "price");
            case "price_desc":
                return Sort.by(Sort.Direction.DESC, "price");
            case "title":
                return Sort.by(Sort.Direction.ASC, "title");
            case "popular":
                // Popular sort is applied in-memory after computing enrolledCount
                return Sort.by(Sort.Direction.DESC, "created_at");
            case "newest":
            default:
                return Sort.by(Sort.Direction.DESC, "created_at");
        }
    }

    @Transactional
    public ModuleResponse addModule(String courseId, String teacherUserId, CreateModuleRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only add modules to your own courses");
        }

        CourseModule module = CourseModule.builder()
                .courseId(courseId)
                .title(request.getTitle())
                .description(request.getDescription())
                .orderIndex(request.getOrderIndex())
                .build();

        module = courseModuleRepository.save(module);
        logger.info("Module '{}' added to course '{}'", module.getTitle(), courseId);
        return toModuleResponse(module);
    }

    @Transactional
    public ModuleResponse updateModule(String courseId, String moduleId, String teacherUserId,
                                       CreateModuleRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only update modules in your own courses");
        }

        CourseModule module = courseModuleRepository.findById(moduleId)
                .orElseThrow(() -> new IllegalArgumentException("Module not found"));

        module.setTitle(request.getTitle());
        module.setDescription(request.getDescription());
        module.setOrderIndex(request.getOrderIndex());

        module = courseModuleRepository.save(module);
        logger.info("Module '{}' updated in course '{}'", module.getTitle(), courseId);
        return toModuleResponse(module);
    }

    @Transactional
    public void deleteModule(String courseId, String moduleId, String teacherUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only delete modules in your own courses");
        }

        lessonRepository.deleteByModuleId(moduleId);
        courseModuleRepository.deleteById(moduleId);
        logger.info("Module '{}' and its lessons deleted from course '{}'", moduleId, courseId);
    }

    @Transactional
    public void deleteCourse(String courseId, String teacherUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only delete your own courses");
        }

        liveSessionRepository.deleteByCourseId(courseId);
        courseEnrollmentRepository.deleteByCourseId(courseId);
        lessonRepository.deleteByCourseId(courseId);
        courseModuleRepository.deleteByCourseId(courseId);
        courseRepository.deleteById(courseId);
        logger.info("Course '{}' and all related data deleted by teacher {}", course.getTitle(), teacherUserId);
    }

    public List<ModuleResponse> getModules(String courseId) {
        return courseModuleRepository.findByCourseIdOrderByOrderIndexAsc(courseId)
                .stream()
                .map(this::toModuleResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public LessonResponse addLesson(String courseId, String moduleId, String teacherUserId,
                                     CreateLessonRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only add lessons to your own courses");
        }

        Lesson lesson = Lesson.builder()
                .moduleId(moduleId)
                .courseId(courseId)
                .title(request.getTitle())
                .content(request.getContent())
                .type(LessonType.valueOf(request.getType()))
                .fileKey(request.getFileKey())
                .videoUrl(request.getVideoUrl())
                .orderIndex(request.getOrderIndex())
                .estimatedMinutes(request.getEstimatedMinutes())
                .build();

        lesson = lessonRepository.save(lesson);
        logger.info("Lesson '{}' added to module '{}' in course '{}'", lesson.getTitle(), moduleId, courseId);
        return toLessonResponse(lesson);
    }

    @Transactional
    public LessonResponse updateLesson(String courseId, String lessonId, String teacherUserId,
                                        CreateLessonRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only update lessons in your own courses");
        }

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found"));

        lesson.setTitle(request.getTitle());
        lesson.setContent(request.getContent());
        lesson.setType(LessonType.valueOf(request.getType()));
        lesson.setFileKey(request.getFileKey());
        lesson.setVideoUrl(request.getVideoUrl());
        lesson.setOrderIndex(request.getOrderIndex());
        lesson.setEstimatedMinutes(request.getEstimatedMinutes());

        lesson = lessonRepository.save(lesson);
        logger.info("Lesson '{}' updated in course '{}'", lesson.getTitle(), courseId);
        return toLessonResponse(lesson);
    }

    @Transactional
    public void deleteLesson(String courseId, String lessonId, String teacherUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only delete lessons in your own courses");
        }

        lessonRepository.deleteById(lessonId);
        logger.info("Lesson '{}' deleted from course '{}'", lessonId, courseId);
    }

    public List<LessonResponse> getLessonsForModule(String courseId, String moduleId) {
        return lessonRepository.findByModuleIdOrderByOrderIndexAsc(moduleId)
                .stream()
                .map(this::toLessonResponse)
                .collect(Collectors.toList());
    }

    public LessonResponse getLesson(String courseId, String lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found"));
        return toLessonResponse(lesson);
    }

    // --- Helper methods ---

    private CourseResponse toCourseResponse(Course course) {
        String teacherDisplayName = userRepository.findById(course.getTeacherUserId())
                .map(User::getDisplayName)
                .orElse("Unknown");

        // Fetch teacher profile data for enriched response
        String teacherHeadline = null;
        String teacherProfileImageUrl = null;
        Double teacherAverageRating = null;
        var teacherProfileOpt = teacherProfileRepository.findByUserId(course.getTeacherUserId());
        if (teacherProfileOpt.isPresent()) {
            var tp = teacherProfileOpt.get();
            teacherHeadline = tp.getHeadline();
            teacherProfileImageUrl = tp.getProfileImageUrl();
            teacherAverageRating = tp.getAverageRating();
        }

        int moduleCount = (int) courseModuleRepository.countByCourseId(course.getId());
        int lessonCount = (int) lessonRepository.countByCourseId(course.getId());
        int enrolledCount = (int) (courseEnrollmentRepository.countByCourseIdAndStatus(course.getId(), EnrollmentStatus.ACTIVE)
                + courseEnrollmentRepository.countByCourseIdAndStatus(course.getId(), EnrollmentStatus.COMPLETED));
        Double avgRating = reviewRepository.findAverageRatingByTeacherUserId(course.getTeacherUserId());

        return new CourseResponse(
                course.getId(),
                course.getTeacherUserId(),
                teacherDisplayName,
                teacherHeadline,
                teacherProfileImageUrl,
                teacherAverageRating,
                course.getTitle(),
                course.getDescription(),
                course.getSubject(),
                course.getPrice(),
                course.getCurrency(),
                course.getThumbnailKey() != null && !course.getThumbnailKey().isBlank()
                        ? s3Service.generatePresignedUrl(course.getThumbnailKey(), 3600)
                        : course.getThumbnailUrl(),
                course.getDifficultyLevel() != null ? course.getDifficultyLevel().name() : null,
                course.getEstimatedHours(),
                course.isPublished(),
                course.getMinAge(),
                course.getMaxAge(),
                course.getTags(),
                moduleCount,
                lessonCount,
                enrolledCount,
                avgRating,
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }

    @Transactional
    public CourseResponse uploadCourseThumbnail(String courseId, String teacherUserId,
                                                 byte[] imageData, String contentType, String originalFilename) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only upload thumbnails to your own courses");
        }

        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                : ".jpg";
        String key = "course-thumbnails/" + courseId + "/"
                + java.util.UUID.randomUUID() + extension;

        s3Service.uploadFile(key, imageData, contentType);

        course.setThumbnailKey(key);
        course = courseRepository.save(course);
        logger.info("Thumbnail uploaded for course '{}'", courseId);

        return toCourseResponse(course);
    }

    @Transactional
    public CourseResponse deleteCourseThumbnail(String courseId, String teacherUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only modify your own courses");
        }

        course.setThumbnailKey(null);
        course.setThumbnailUrl(null);
        course = courseRepository.save(course);
        logger.info("Thumbnail removed for course '{}'", courseId);
        return toCourseResponse(course);
    }

    @Transactional
    public ModuleResponse uploadModuleThumbnail(String courseId, String moduleId, String teacherUserId,
                                                 byte[] imageData, String contentType, String originalFilename) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only upload thumbnails to your own course modules");
        }

        CourseModule module = courseModuleRepository.findById(moduleId)
                .orElseThrow(() -> new IllegalArgumentException("Module not found"));

        if (!module.getCourseId().equals(courseId)) {
            throw new RuntimeException("Module does not belong to this course");
        }

        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                : ".jpg";
        String key = "module-thumbnails/" + courseId + "/" + moduleId + "/"
                + java.util.UUID.randomUUID() + extension;

        s3Service.uploadFile(key, imageData, contentType);

        module.setThumbnailKey(key);
        module = courseModuleRepository.save(module);
        logger.info("Thumbnail uploaded for module '{}' in course '{}'", moduleId, courseId);

        return toModuleResponse(module);
    }

    @Transactional
    public ModuleResponse deleteModuleThumbnail(String courseId, String moduleId, String teacherUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (!course.getTeacherUserId().equals(teacherUserId)) {
            throw new RuntimeException("You can only modify your own course modules");
        }

        CourseModule module = courseModuleRepository.findById(moduleId)
                .orElseThrow(() -> new IllegalArgumentException("Module not found"));

        module.setThumbnailKey(null);
        module = courseModuleRepository.save(module);
        logger.info("Thumbnail removed for module '{}' in course '{}'", moduleId, courseId);
        return toModuleResponse(module);
    }

    private ModuleResponse toModuleResponse(CourseModule module) {
        int lessonCount = (int) lessonRepository.countByModuleId(module.getId());
        String thumbnailUrl = null;
        if (module.getThumbnailKey() != null && !module.getThumbnailKey().isBlank()) {
            thumbnailUrl = s3Service.generatePresignedUrl(module.getThumbnailKey(), 3600);
        }
        return new ModuleResponse(
                module.getId(),
                module.getCourseId(),
                module.getTitle(),
                module.getDescription(),
                module.getOrderIndex(),
                lessonCount,
                thumbnailUrl,
                module.getCreatedAt()
        );
    }

    private LessonResponse toLessonResponse(Lesson lesson) {
        String fileUrl = null;
        if (lesson.getFileKey() != null && !lesson.getFileKey().isBlank()) {
            fileUrl = s3Service.generatePresignedUrl(lesson.getFileKey(), 3600);
        }
        return new LessonResponse(
                lesson.getId(),
                lesson.getModuleId(),
                lesson.getCourseId(),
                lesson.getTitle(),
                lesson.getContent(),
                lesson.getType() != null ? lesson.getType().name() : null,
                lesson.getVideoUrl(),
                fileUrl,
                lesson.getOrderIndex(),
                lesson.getEstimatedMinutes(),
                lesson.getCreatedAt()
        );
    }
}
