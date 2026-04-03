package com.videostreaming.course.controller;

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
import com.videostreaming.course.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PostMapping
    public ResponseEntity<?> createCourse(@Valid @RequestBody CreateCourseRequest request,
                                           Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            CourseResponse response = courseService.createCourse(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{courseId}")
    public ResponseEntity<?> updateCourse(@PathVariable String courseId,
                                           @RequestBody CreateCourseRequest request,
                                           Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            CourseResponse response = courseService.updateCourse(courseId, userId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{courseId}/publish")
    public ResponseEntity<?> publishCourse(@PathVariable String courseId,
                                            Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            CourseResponse response = courseService.publishCourse(courseId, userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<?> deleteCourse(@PathVariable String courseId,
                                           Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            courseService.deleteCourse(courseId, userId);
            return ResponseEntity.ok(Map.of("message", "Course deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getCourses() {
        return ResponseEntity.ok(courseService.getCourses());
    }

    @GetMapping("/search")
    public ResponseEntity<CourseSearchResponse> searchCourses(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(required = false) String country,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "12") int size,
            Authentication authentication) {
        String userId = null;
        if (authentication != null && authentication.getPrincipal() instanceof String) {
            userId = (String) authentication.getPrincipal();
        }
        CourseSearchResponse response = courseService.searchCourses(
                q, subject, difficulty, minPrice, maxPrice, sortBy, minRating,
                country, userId, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<String>> getSubjects() {
        return ResponseEntity.ok(courseService.getSubjects());
    }

    @GetMapping("/my")
    public ResponseEntity<List<CourseResponse>> getTeacherCourses(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(courseService.getTeacherCourses(userId));
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<?> getCourse(@PathVariable String courseId) {
        try {
            CourseResponse response = courseService.getCourse(courseId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{courseId}/modules")
    public ResponseEntity<?> addModule(@PathVariable String courseId,
                                        @RequestBody CreateModuleRequest request,
                                        Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            ModuleResponse response = courseService.addModule(courseId, userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{courseId}/modules/{moduleId}")
    public ResponseEntity<?> updateModule(@PathVariable String courseId,
                                           @PathVariable String moduleId,
                                           @RequestBody CreateModuleRequest request,
                                           Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            ModuleResponse response = courseService.updateModule(courseId, moduleId, userId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{courseId}/modules/{moduleId}")
    public ResponseEntity<?> deleteModule(@PathVariable String courseId,
                                           @PathVariable String moduleId,
                                           Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            courseService.deleteModule(courseId, moduleId, userId);
            return ResponseEntity.ok(Map.of("message", "Module deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{courseId}/modules")
    public ResponseEntity<List<ModuleResponse>> getModules(@PathVariable String courseId) {
        return ResponseEntity.ok(courseService.getModules(courseId));
    }

    @PostMapping("/{courseId}/thumbnail")
    public ResponseEntity<?> uploadCourseThumbnail(@PathVariable String courseId,
                                                    @RequestParam("file") MultipartFile file,
                                                    Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            CourseResponse response = courseService.uploadCourseThumbnail(
                    courseId, userId,
                    file.getBytes(), file.getContentType(), file.getOriginalFilename());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to upload thumbnail"));
        }
    }

    @DeleteMapping("/{courseId}/thumbnail")
    public ResponseEntity<?> deleteCourseThumbnail(@PathVariable String courseId,
                                                    Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            CourseResponse response = courseService.deleteCourseThumbnail(courseId, userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{courseId}/modules/{moduleId}/thumbnail")
    public ResponseEntity<?> uploadModuleThumbnail(@PathVariable String courseId,
                                                    @PathVariable String moduleId,
                                                    @RequestParam("file") MultipartFile file,
                                                    Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            ModuleResponse response = courseService.uploadModuleThumbnail(
                    courseId, moduleId, userId,
                    file.getBytes(), file.getContentType(), file.getOriginalFilename());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to upload thumbnail"));
        }
    }

    @DeleteMapping("/{courseId}/modules/{moduleId}/thumbnail")
    public ResponseEntity<?> deleteModuleThumbnail(@PathVariable String courseId,
                                                    @PathVariable String moduleId,
                                                    Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            ModuleResponse response = courseService.deleteModuleThumbnail(courseId, moduleId, userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{courseId}/modules/{moduleId}/lessons")
    public ResponseEntity<?> addLesson(@PathVariable String courseId,
                                        @PathVariable String moduleId,
                                        @RequestBody CreateLessonRequest request,
                                        Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            LessonResponse response = courseService.addLesson(courseId, moduleId, userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{courseId}/lessons/{lessonId}")
    public ResponseEntity<?> updateLesson(@PathVariable String courseId,
                                           @PathVariable String lessonId,
                                           @RequestBody CreateLessonRequest request,
                                           Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            LessonResponse response = courseService.updateLesson(courseId, lessonId, userId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{courseId}/lessons/{lessonId}")
    public ResponseEntity<?> deleteLesson(@PathVariable String courseId,
                                           @PathVariable String lessonId,
                                           Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            courseService.deleteLesson(courseId, lessonId, userId);
            return ResponseEntity.ok(Map.of("message", "Lesson deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{courseId}/modules/{moduleId}/lessons")
    public ResponseEntity<List<LessonResponse>> getLessonsForModule(@PathVariable String courseId,
                                                                     @PathVariable String moduleId) {
        return ResponseEntity.ok(courseService.getLessonsForModule(courseId, moduleId));
    }

    @GetMapping("/{courseId}/lessons/{lessonId}")
    public ResponseEntity<?> getLesson(@PathVariable String courseId,
                                        @PathVariable String lessonId) {
        try {
            LessonResponse response = courseService.getLesson(courseId, lessonId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
