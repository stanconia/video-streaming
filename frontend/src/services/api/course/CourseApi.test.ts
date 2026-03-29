import axios from 'axios';
import { CourseApi } from './CourseApi';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
  },
}));

describe('CourseApi', () => {
  let courseApi: CourseApi;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };
    (axios.create as jest.Mock).mockReturnValue(mockClient);
    localStorage.clear();
    courseApi = new CourseApi();
  });

  describe('getCourses', () => {
    it('calls GET /courses', async () => {
      const mockCourses = [
        { id: '1', title: 'Course 1' },
        { id: '2', title: 'Course 2' },
      ];
      mockClient.get.mockResolvedValue({ data: mockCourses });

      const result = await courseApi.getCourses();

      expect(mockClient.get).toHaveBeenCalledWith('/courses');
      expect(result).toEqual(mockCourses);
    });
  });

  describe('getCourse', () => {
    it('calls GET /courses/:id', async () => {
      const mockCourse = { id: 'course-1', title: 'Test Course' };
      mockClient.get.mockResolvedValue({ data: mockCourse });

      const result = await courseApi.getCourse('course-1');

      expect(mockClient.get).toHaveBeenCalledWith('/courses/course-1');
      expect(result).toEqual(mockCourse);
    });
  });

  describe('createCourse', () => {
    it('calls POST /courses with course data', async () => {
      const courseData = {
        title: 'New Course',
        description: 'A great course',
        subject: 'Math',
        price: 2999,
        currency: 'USD',
        difficultyLevel: 'BEGINNER',
        estimatedHours: 10,
      };
      const mockCreated = { id: 'new-1', ...courseData };
      mockClient.post.mockResolvedValue({ data: mockCreated });

      const result = await courseApi.createCourse(courseData as any);

      expect(mockClient.post).toHaveBeenCalledWith('/courses', courseData);
      expect(result).toEqual(mockCreated);
    });
  });

  describe('searchCourses', () => {
    it('calls GET /courses/search with query params', async () => {
      const mockResponse = {
        content: [{ id: '1', title: 'React Course' }],
        page: 0,
        size: 12,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };
      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await courseApi.searchCourses({
        q: 'react',
        subject: 'Web Development',
        difficulty: 'BEGINNER',
        page: 0,
        size: 12,
      });

      const calledUrl = mockClient.get.mock.calls[0][0];
      expect(calledUrl).toContain('/courses/search?');
      expect(calledUrl).toContain('q=react');
      expect(calledUrl).toContain('subject=Web+Development');
      expect(calledUrl).toContain('difficulty=BEGINNER');
      expect(result).toEqual(mockResponse);
    });

    it('omits undefined params from the query string', async () => {
      mockClient.get.mockResolvedValue({
        data: { content: [], page: 0, size: 12, totalElements: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      });

      await courseApi.searchCourses({ q: 'test' });

      const calledUrl = mockClient.get.mock.calls[0][0];
      expect(calledUrl).toContain('q=test');
      expect(calledUrl).not.toContain('subject=');
      expect(calledUrl).not.toContain('difficulty=');
    });

    it('includes price range params when provided', async () => {
      mockClient.get.mockResolvedValue({
        data: { content: [], page: 0, size: 12, totalElements: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      });

      await courseApi.searchCourses({ minPrice: 1000, maxPrice: 5000 });

      const calledUrl = mockClient.get.mock.calls[0][0];
      expect(calledUrl).toContain('minPrice=1000');
      expect(calledUrl).toContain('maxPrice=5000');
    });
  });

  describe('getTeacherCourses', () => {
    it('calls GET /courses/my', async () => {
      const mockCourses = [{ id: '1', title: 'My Course' }];
      mockClient.get.mockResolvedValue({ data: mockCourses });

      const result = await courseApi.getTeacherCourses();

      expect(mockClient.get).toHaveBeenCalledWith('/courses/my');
      expect(result).toEqual(mockCourses);
    });
  });

  describe('updateCourse', () => {
    it('calls PUT /courses/:id with partial data', async () => {
      const updateData = { title: 'Updated Title' };
      const mockUpdated = { id: 'course-1', title: 'Updated Title' };
      mockClient.put.mockResolvedValue({ data: mockUpdated });

      const result = await courseApi.updateCourse('course-1', updateData);

      expect(mockClient.put).toHaveBeenCalledWith('/courses/course-1', updateData);
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('deleteCourse', () => {
    it('calls DELETE /courses/:id', async () => {
      mockClient.delete.mockResolvedValue({});

      await courseApi.deleteCourse('course-1');

      expect(mockClient.delete).toHaveBeenCalledWith('/courses/course-1');
    });
  });

  describe('getSubjects', () => {
    it('calls GET /courses/subjects', async () => {
      const mockSubjects = ['Math', 'Science', 'History'];
      mockClient.get.mockResolvedValue({ data: mockSubjects });

      const result = await courseApi.getSubjects();

      expect(mockClient.get).toHaveBeenCalledWith('/courses/subjects');
      expect(result).toEqual(mockSubjects);
    });
  });

  describe('interceptors', () => {
    it('sets up request and response interceptors', () => {
      expect(mockClient.interceptors.request.use).toHaveBeenCalled();
      expect(mockClient.interceptors.response.use).toHaveBeenCalled();
    });
  });
});
