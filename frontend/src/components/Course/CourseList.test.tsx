import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CourseList } from './CourseList';
import { courseApi } from '../../services/api/course/CourseApi';

jest.mock('../../services/api/course/CourseApi', () => ({
  courseApi: {
    searchCourses: jest.fn(),
    getSubjects: jest.fn(),
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(() => jest.fn()),
}));

const mockCourseApi = courseApi as jest.Mocked<typeof courseApi>;

const mockCourseSearchResponse = {
  content: [
    {
      id: 'course-1',
      teacherUserId: 'teacher-1',
      teacherDisplayName: 'Dr. Smith',
      title: 'Introduction to React',
      description: 'Learn React basics',
      subject: 'Web Development',
      price: 2999,
      currency: 'USD',
      thumbnailUrl: null,
      difficultyLevel: 'BEGINNER' as const,
      estimatedHours: 10,
      published: true,
      minAge: null,
      maxAge: null,
      tags: 'react,javascript',
      moduleCount: 5,
      lessonCount: 20,
      enrolledCount: 150,
      averageRating: 4.5,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    },
    {
      id: 'course-2',
      teacherUserId: 'teacher-2',
      teacherDisplayName: 'Prof. Johnson',
      title: 'Advanced TypeScript',
      description: 'Deep dive into TypeScript',
      subject: 'Programming',
      price: 0,
      currency: 'USD',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      difficultyLevel: 'ADVANCED' as const,
      estimatedHours: 20,
      published: true,
      minAge: null,
      maxAge: null,
      tags: null,
      moduleCount: 8,
      lessonCount: 40,
      enrolledCount: 75,
      averageRating: null,
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-02-10T00:00:00Z',
    },
  ],
  page: 0,
  size: 12,
  totalElements: 2,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCourseApi.getSubjects.mockResolvedValue(['Web Development', 'Programming', 'Math']);
});

describe('CourseList', () => {
  it('shows loading state initially', () => {
    // Make the search never resolve to keep loading state
    mockCourseApi.searchCourses.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading courses...')).toBeInTheDocument();
  });

  it('renders course cards after data loads', async () => {
    mockCourseApi.searchCourses.mockResolvedValue(mockCourseSearchResponse);

    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    });

    expect(screen.getByText('Advanced TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Prof. Johnson')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('BEGINNER')).toBeInTheDocument();
    expect(screen.getByText('ADVANCED')).toBeInTheDocument();
  });

  it('handles empty state', async () => {
    mockCourseApi.searchCourses.mockResolvedValue({
      content: [],
      page: 0,
      size: 12,
      totalElements: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    });

    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No courses found.')).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    mockCourseApi.searchCourses.mockRejectedValue({
      response: { data: { error: 'Server error' } },
    });

    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('shows results summary when courses are loaded', async () => {
    mockCourseApi.searchCourses.mockResolvedValue(mockCourseSearchResponse);

    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/2 results found/)).toBeInTheDocument();
    });
  });

  it('renders search input and filters', async () => {
    mockCourseApi.searchCourses.mockResolvedValue(mockCourseSearchResponse);

    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Search courses by title, subject, teacher, or tags...')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Browse Courses')).toBeInTheDocument();
  });

  it('renders tags on course cards', async () => {
    mockCourseApi.searchCourses.mockResolvedValue(mockCourseSearchResponse);

    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('javascript')).toBeInTheDocument();
    });
  });
});
