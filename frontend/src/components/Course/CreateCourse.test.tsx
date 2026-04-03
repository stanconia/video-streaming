import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateCourse } from './CreateCourse';
import { courseApi } from '../../services/api/course/CourseApi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

jest.mock('../../services/api/course/CourseApi', () => ({
  courseApi: {
    createCourse: jest.fn(),
    uploadCourseThumbnail: jest.fn(),
  },
}));

jest.mock('../shared/SubjectSelector', () => ({
  SubjectSelector: ({ value, onChange, placeholder }: any) => (
    <input data-testid="subject-selector" value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder || 'Select subject'} />
  ),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const mockCourseApi = courseApi as jest.Mocked<typeof courseApi>;
const mockNavigate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({
    user: {
      userId: 'teacher-1',
      email: 'teacher@test.com',
      displayName: 'Teacher User',
      role: 'TEACHER',
    },
  });
  (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
});

describe('CreateCourse', () => {
  it('renders course creation form', () => {
    render(<CreateCourse />);

    expect(screen.getByText('Create a Course')).toBeInTheDocument();
    expect(screen.getByText('Title *')).toBeInTheDocument();
    expect(screen.getByText('Description *')).toBeInTheDocument();
    expect(screen.getByText('Subject *')).toBeInTheDocument();
    expect(screen.getByText('Price (USD) *')).toBeInTheDocument();
    expect(screen.getByText('Difficulty Level *')).toBeInTheDocument();
    expect(screen.getByText('Estimated Hours *')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Course' })).toBeInTheDocument();
  });

  it('submits course with title and description', async () => {
    const mockCreated = {
      id: 'new-course-1',
      title: 'React Fundamentals',
      description: 'Learn React from scratch',
      subject: 'Web Dev',
      price: 1999,
      currency: 'USD',
      thumbnailUrl: null,
      difficultyLevel: 'BEGINNER' as const,
      estimatedHours: 1,
      published: false,
      minAge: null,
      maxAge: null,
      tags: null,
      moduleCount: 0,
      lessonCount: 0,
      enrolledCount: 0,
      averageRating: null,
      teacherUserId: 'teacher-1',
      teacherDisplayName: 'Teacher User',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    mockCourseApi.createCourse.mockResolvedValue(mockCreated);

    const user = userEvent.setup();

    render(<CreateCourse />);

    await user.type(
      screen.getByPlaceholderText('e.g., Complete React Development Guide'),
      'React Fundamentals'
    );
    await user.type(
      screen.getByPlaceholderText('Describe what students will learn in this course...'),
      'Learn React from scratch'
    );
    await user.type(screen.getByTestId('subject-selector'), 'Web Dev');

    // Clear the default price and type new price
    const priceInput = screen.getByDisplayValue('0');
    await user.clear(priceInput);
    await user.type(priceInput, '19.99');

    await user.click(screen.getByRole('button', { name: 'Create Course' }));

    await waitFor(() => {
      expect(mockCourseApi.createCourse).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'React Fundamentals',
          description: 'Learn React from scratch',
          subject: 'Web Dev',
          price: 1999,
          currency: 'USD',
          difficultyLevel: 'BEGINNER',
          estimatedHours: 1,
        })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/courses/new-course-1/builder');
    });
  });

  it('shows error when course creation fails', async () => {
    mockCourseApi.createCourse.mockRejectedValue({
      response: { data: { error: 'Title is required' } },
    });

    const user = userEvent.setup();

    render(<CreateCourse />);

    await user.type(
      screen.getByPlaceholderText('e.g., Complete React Development Guide'),
      'Test'
    );
    await user.type(
      screen.getByPlaceholderText('Describe what students will learn in this course...'),
      'Test description'
    );
    await user.type(screen.getByTestId('subject-selector'), 'Test');

    await user.click(screen.getByRole('button', { name: 'Create Course' }));

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  it('renders back button that navigates to my courses', async () => {
    const user = userEvent.setup();

    render(<CreateCourse />);

    const backButton = screen.getByText(/Back to My Courses/);
    expect(backButton).toBeInTheDocument();

    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/my-courses');
  });

  it('renders difficulty level select with options', () => {
    render(<CreateCourse />);

    expect(screen.getByDisplayValue('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('shows submitting state while creating course', async () => {
    mockCourseApi.createCourse.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();

    render(<CreateCourse />);

    await user.type(
      screen.getByPlaceholderText('e.g., Complete React Development Guide'),
      'Test Course'
    );
    await user.type(
      screen.getByPlaceholderText('Describe what students will learn in this course...'),
      'Description'
    );
    await user.type(screen.getByTestId('subject-selector'), 'Subject');

    await user.click(screen.getByRole('button', { name: 'Create Course' }));

    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });
});
