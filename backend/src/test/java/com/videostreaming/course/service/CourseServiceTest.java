package com.videostreaming.course.service;

import com.videostreaming.course.dto.*;
import com.videostreaming.course.model.*;
import com.videostreaming.course.repository.*;
import com.videostreaming.live.repository.LiveSessionRepository;
import com.videostreaming.review.repository.ReviewRepository;
import com.videostreaming.shared.service.S3Service;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseModuleRepository courseModuleRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private CourseEnrollmentRepository courseEnrollmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private TeacherProfileRepository teacherProfileRepository;

    @Mock
    private LiveSessionRepository liveSessionRepository;

    @Mock
    private S3Service s3Service;

    @InjectMocks
    private CourseService courseService;

    // --- Helper methods to reduce duplication ---

    private CreateCourseRequest buildCreateCourseRequest() {
        CreateCourseRequest request = new CreateCourseRequest();
        request.setTitle("Java Fundamentals");
        request.setDescription("Learn Java from scratch");
        request.setSubject("Programming");
        request.setPrice(new BigDecimal("49.99"));
        request.setCurrency("USD");
        request.setDifficultyLevel("BEGINNER");
        request.setEstimatedHours(20);
        request.setTags("java,programming,beginner");
        return request;
    }

    private Course buildCourse(String id, String teacherUserId) {
        return Course.builder()
                .id(id)
                .teacherUserId(teacherUserId)
                .title("Java Fundamentals")
                .description("Learn Java from scratch")
                .subject("Programming")
                .price(new BigDecimal("49.99"))
                .currency("USD")
                .difficultyLevel(DifficultyLevel.BEGINNER)
                .estimatedHours(20)
                .tags("java,programming,beginner")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private void stubToCourseResponseDependencies(Course course) {
        User teacher = User.builder()
                .id(course.getTeacherUserId())
                .displayName("Teacher Name")
                .email("teacher@example.com")
                .role(UserRole.TEACHER)
                .build();
        lenient().when(userRepository.findById(course.getTeacherUserId())).thenReturn(Optional.of(teacher));
        lenient().when(teacherProfileRepository.findByUserId(course.getTeacherUserId())).thenReturn(Optional.empty());
        lenient().when(courseModuleRepository.countByCourseId(course.getId())).thenReturn(0L);
        lenient().when(lessonRepository.countByCourseId(course.getId())).thenReturn(0L);
        lenient().when(courseEnrollmentRepository.countByCourseIdAndStatus(eq(course.getId()), any(EnrollmentStatus.class))).thenReturn(0L);
        lenient().when(reviewRepository.findAverageRatingByTeacherUserId(course.getTeacherUserId())).thenReturn(null);
    }

    // --- createCourse tests ---

    @Test
    void createCourse_success_returnsCourseResponseWithCorrectFields() {
        String teacherUserId = "teacher-1";
        CreateCourseRequest request = buildCreateCourseRequest();
        Course savedCourse = buildCourse("course-1", teacherUserId);

        when(courseRepository.save(any(Course.class))).thenReturn(savedCourse);
        stubToCourseResponseDependencies(savedCourse);

        CourseResponse response = courseService.createCourse(teacherUserId, request);

        assertNotNull(response);
        assertEquals("course-1", response.getId());
        assertEquals(teacherUserId, response.getTeacherUserId());
        assertEquals("Java Fundamentals", response.getTitle());
        assertEquals("Learn Java from scratch", response.getDescription());
        assertEquals("Programming", response.getSubject());
        assertEquals(new BigDecimal("49.99"), response.getPrice());

        verify(courseRepository).save(any(Course.class));
    }

    @Test
    void createCourse_nullCurrency_defaultsToUSD() {
        String teacherUserId = "teacher-1";
        CreateCourseRequest request = buildCreateCourseRequest();
        request.setCurrency(null);

        Course savedCourse = buildCourse("course-2", teacherUserId);
        savedCourse.setCurrency("USD");

        when(courseRepository.save(any(Course.class))).thenReturn(savedCourse);
        stubToCourseResponseDependencies(savedCourse);

        ArgumentCaptor<Course> courseCaptor = ArgumentCaptor.forClass(Course.class);
        courseService.createCourse(teacherUserId, request);

        verify(courseRepository).save(courseCaptor.capture());
        assertEquals("USD", courseCaptor.getValue().getCurrency());
    }

    // --- getCourse tests ---

    @Test
    void getCourse_found_returnsCourseResponse() {
        Course course = buildCourse("course-1", "teacher-1");

        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));
        stubToCourseResponseDependencies(course);

        CourseResponse response = courseService.getCourse("course-1");

        assertNotNull(response);
        assertEquals("course-1", response.getId());
        assertEquals("Java Fundamentals", response.getTitle());
    }

    @Test
    void getCourse_notFound_throwsIllegalArgumentException() {
        when(courseRepository.findById("nonexistent")).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> courseService.getCourse("nonexistent"));
        assertEquals("Course not found", exception.getMessage());
    }

    // --- publishCourse tests ---

    @Test
    void publishCourse_success_togglesPublishedState() {
        Course course = buildCourse("course-1", "teacher-1");
        course.setPublished(false);

        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));

        Course publishedCourse = buildCourse("course-1", "teacher-1");
        publishedCourse.setPublished(true);
        when(courseRepository.save(any(Course.class))).thenReturn(publishedCourse);
        stubToCourseResponseDependencies(publishedCourse);

        CourseResponse response = courseService.publishCourse("course-1", "teacher-1");

        assertTrue(response.isPublished());
        verify(courseRepository).save(any(Course.class));
    }

    @Test
    void publishCourse_notOwner_throwsRuntimeException() {
        Course course = buildCourse("course-1", "teacher-1");

        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> courseService.publishCourse("course-1", "other-teacher"));
        assertEquals("You can only publish your own courses", exception.getMessage());
    }

    // --- updateCourse tests ---

    @Test
    void updateCourse_success_returnsUpdatedCourseResponse() {
        String teacherUserId = "teacher-1";
        Course existingCourse = buildCourse("course-1", teacherUserId);

        CreateCourseRequest updateRequest = new CreateCourseRequest();
        updateRequest.setTitle("Advanced Java");
        updateRequest.setDescription("Advanced Java topics");
        updateRequest.setSubject("Programming");
        updateRequest.setPrice(new BigDecimal("79.99"));
        updateRequest.setCurrency("USD");
        updateRequest.setDifficultyLevel("ADVANCED");
        updateRequest.setEstimatedHours(40);
        updateRequest.setTags("java,advanced");

        when(courseRepository.findById("course-1")).thenReturn(Optional.of(existingCourse));

        Course updatedCourse = buildCourse("course-1", teacherUserId);
        updatedCourse.setTitle("Advanced Java");
        updatedCourse.setDescription("Advanced Java topics");
        updatedCourse.setPrice(new BigDecimal("79.99"));
        updatedCourse.setDifficultyLevel(DifficultyLevel.ADVANCED);
        updatedCourse.setEstimatedHours(40);
        updatedCourse.setTags("java,advanced");

        when(courseRepository.save(any(Course.class))).thenReturn(updatedCourse);
        stubToCourseResponseDependencies(updatedCourse);

        CourseResponse response = courseService.updateCourse("course-1", teacherUserId, updateRequest);

        assertNotNull(response);
        assertEquals("Advanced Java", response.getTitle());
        assertEquals("Advanced Java topics", response.getDescription());
    }

    @Test
    void updateCourse_notOwner_throwsRuntimeException() {
        Course course = buildCourse("course-1", "teacher-1");

        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));

        CreateCourseRequest request = buildCreateCourseRequest();

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> courseService.updateCourse("course-1", "other-teacher", request));
        assertEquals("You can only update your own courses", exception.getMessage());
    }

    // --- addModule tests ---

    @Test
    void addModule_success_returnsModuleResponse() {
        String teacherUserId = "teacher-1";
        Course course = buildCourse("course-1", teacherUserId);

        CreateModuleRequest request = new CreateModuleRequest();
        request.setTitle("Module 1: Introduction");
        request.setDescription("Introduction to Java");
        request.setOrderIndex(1);

        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));

        CourseModule savedModule = CourseModule.builder()
                .id("module-1")
                .courseId("course-1")
                .title("Module 1: Introduction")
                .description("Introduction to Java")
                .orderIndex(1)
                .createdAt(LocalDateTime.now())
                .build();
        when(courseModuleRepository.save(any(CourseModule.class))).thenReturn(savedModule);
        when(lessonRepository.countByModuleId("module-1")).thenReturn(0L);

        ModuleResponse response = courseService.addModule("course-1", teacherUserId, request);

        assertNotNull(response);
        assertEquals("module-1", response.getId());
        assertEquals("course-1", response.getCourseId());
        assertEquals("Module 1: Introduction", response.getTitle());
        assertEquals("Introduction to Java", response.getDescription());
        assertEquals(1, response.getOrderIndex());
    }

    @Test
    void addModule_notOwner_throwsRuntimeException() {
        Course course = buildCourse("course-1", "teacher-1");
        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));

        CreateModuleRequest request = new CreateModuleRequest();
        request.setTitle("Module");

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> courseService.addModule("course-1", "other-teacher", request));
        assertEquals("You can only add modules to your own courses", exception.getMessage());
    }

    // --- deleteModule tests ---

    @Test
    void deleteModule_success_deletesModuleAndLessons() {
        String teacherUserId = "teacher-1";
        Course course = buildCourse("course-1", teacherUserId);

        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));

        courseService.deleteModule("course-1", "module-1", teacherUserId);

        verify(lessonRepository).deleteByModuleId("module-1");
        verify(courseModuleRepository).deleteById("module-1");
    }

    @Test
    void deleteModule_notOwner_throwsRuntimeException() {
        Course course = buildCourse("course-1", "teacher-1");
        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> courseService.deleteModule("course-1", "module-1", "other-teacher"));
        assertEquals("You can only delete modules in your own courses", exception.getMessage());
    }

    // --- addLesson tests ---

    @Test
    void addLesson_success_returnsLessonResponse() {
        String teacherUserId = "teacher-1";
        Course course = buildCourse("course-1", teacherUserId);

        CreateLessonRequest request = new CreateLessonRequest();
        request.setTitle("Lesson 1: Variables");
        request.setContent("Learn about variables in Java");
        request.setType("VIDEO");
        request.setVideoUrl("https://example.com/video.mp4");
        request.setOrderIndex(1);
        request.setEstimatedMinutes(30);

        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));

        Lesson savedLesson = Lesson.builder()
                .id("lesson-1")
                .moduleId("module-1")
                .courseId("course-1")
                .title("Lesson 1: Variables")
                .content("Learn about variables in Java")
                .type(LessonType.VIDEO)
                .videoUrl("https://example.com/video.mp4")
                .orderIndex(1)
                .estimatedMinutes(30)
                .createdAt(LocalDateTime.now())
                .build();
        when(lessonRepository.save(any(Lesson.class))).thenReturn(savedLesson);

        LessonResponse response = courseService.addLesson("course-1", "module-1", teacherUserId, request);

        assertNotNull(response);
        assertEquals("lesson-1", response.getId());
        assertEquals("module-1", response.getModuleId());
        assertEquals("course-1", response.getCourseId());
        assertEquals("Lesson 1: Variables", response.getTitle());
        assertEquals("VIDEO", response.getType());
        assertEquals(30, response.getEstimatedMinutes());
    }

    @Test
    void addLesson_notOwner_throwsRuntimeException() {
        Course course = buildCourse("course-1", "teacher-1");
        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));

        CreateLessonRequest request = new CreateLessonRequest();
        request.setTitle("Lesson");
        request.setType("TEXT");

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> courseService.addLesson("course-1", "module-1", "other-teacher", request));
        assertEquals("You can only add lessons to your own courses", exception.getMessage());
    }

    // --- getTeacherCourses tests ---

    @Test
    void getTeacherCourses_returnsList() {
        String teacherUserId = "teacher-1";
        Course course1 = buildCourse("course-1", teacherUserId);
        Course course2 = buildCourse("course-2", teacherUserId);
        course2.setTitle("Python Basics");

        when(courseRepository.findByTeacherUserIdOrderByCreatedAtDesc(teacherUserId))
                .thenReturn(List.of(course1, course2));

        // Stub toCourseResponse dependencies for both courses
        User teacher = User.builder()
                .id(teacherUserId)
                .displayName("Teacher Name")
                .email("teacher@example.com")
                .role(UserRole.TEACHER)
                .build();
        when(userRepository.findById(teacherUserId)).thenReturn(Optional.of(teacher));
        when(teacherProfileRepository.findByUserId(teacherUserId)).thenReturn(Optional.empty());
        when(courseModuleRepository.countByCourseId(anyString())).thenReturn(0L);
        when(lessonRepository.countByCourseId(anyString())).thenReturn(0L);
        when(courseEnrollmentRepository.countByCourseIdAndStatus(anyString(), any(EnrollmentStatus.class))).thenReturn(0L);
        when(reviewRepository.findAverageRatingByTeacherUserId(teacherUserId)).thenReturn(null);

        List<CourseResponse> responses = courseService.getTeacherCourses(teacherUserId);

        assertNotNull(responses);
        assertEquals(2, responses.size());
    }

    // --- searchCourses tests ---

    @Test
    void searchCourses_returnsSearchResponse() {
        Course course = buildCourse("course-1", "teacher-1");
        Page<Course> coursePage = new PageImpl<>(List.of(course));

        when(courseRepository.searchCourses(anyString(), anyString(), anyString(),
                any(), any(), any(Pageable.class))).thenReturn(coursePage);
        stubToCourseResponseDependencies(course);

        CourseSearchResponse response = courseService.searchCourses(
                "Java", null, null, null, null, "newest", null, 0, 10);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals(1, response.getTotalElements());
    }

    @Test
    void searchCourses_emptyResult_returnsEmptyContent() {
        Page<Course> emptyPage = new PageImpl<>(Collections.emptyList());

        when(courseRepository.searchCourses(anyString(), anyString(), anyString(),
                any(), any(), any(Pageable.class))).thenReturn(emptyPage);

        CourseSearchResponse response = courseService.searchCourses(
                "nonexistent", null, null, null, null, null, null, 0, 10);

        assertNotNull(response);
        assertTrue(response.getContent().isEmpty());
        assertEquals(0, response.getTotalElements());
    }

    // --- deleteCourse tests ---

    @Test
    void deleteCourse_success_deletesAllRelatedData() {
        String teacherUserId = "teacher-1";
        Course course = buildCourse("course-1", teacherUserId);

        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));

        courseService.deleteCourse("course-1", teacherUserId);

        verify(liveSessionRepository).deleteByCourseId("course-1");
        verify(courseEnrollmentRepository).deleteByCourseId("course-1");
        verify(lessonRepository).deleteByCourseId("course-1");
        verify(courseModuleRepository).deleteByCourseId("course-1");
        verify(courseRepository).deleteById("course-1");
    }

    @Test
    void deleteCourse_notOwner_throwsRuntimeException() {
        Course course = buildCourse("course-1", "teacher-1");
        when(courseRepository.findById("course-1")).thenReturn(Optional.of(course));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> courseService.deleteCourse("course-1", "other-teacher"));
        assertEquals("You can only delete your own courses", exception.getMessage());
    }
}
