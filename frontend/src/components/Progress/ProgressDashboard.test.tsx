import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProgressDashboard } from './ProgressDashboard';
import { progressApi } from '../../services/api/progress/ProgressApi';
import { useAuth } from '../../context/AuthContext';

jest.mock('../../services/api/progress/ProgressApi', () => ({
  progressApi: {
    getAllProgress: jest.fn(),
  },
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockProgressApi = progressApi as jest.Mocked<typeof progressApi>;

const mockProgressList = [
  {
    courseId: 'course-1',
    courseTitle: 'Introduction to React',
    enrollmentId: 'enroll-1',
    totalLessons: 20,
    completedLessons: 20,
    progressPercentage: 100,
    lessons: [],
    averageQuizScore: 92,
    lastAccessedAt: '2024-03-15T10:00:00Z',
  },
  {
    courseId: 'course-2',
    courseTitle: 'Advanced TypeScript',
    enrollmentId: 'enroll-2',
    totalLessons: 30,
    completedLessons: 15,
    progressPercentage: 50,
    lessons: [],
    averageQuizScore: 78,
    lastAccessedAt: '2024-03-20T14:30:00Z',
  },
  {
    courseId: 'course-3',
    courseTitle: 'Node.js Basics',
    enrollmentId: 'enroll-3',
    totalLessons: 10,
    completedLessons: 0,
    progressPercentage: 0,
    lessons: [],
    averageQuizScore: null,
    lastAccessedAt: null,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({
    user: { userId: 'student-1', role: 'STUDENT' },
  });
});

describe('ProgressDashboard', () => {
  it('shows loading state initially', () => {
    mockProgressApi.getAllProgress.mockImplementation(() => new Promise(() => {}));

    render(<ProgressDashboard />);

    expect(screen.getByText('Loading your progress...')).toBeInTheDocument();
  });

  it('renders page title and subtitle', async () => {
    mockProgressApi.getAllProgress.mockResolvedValue(mockProgressList);

    render(<ProgressDashboard />);

    expect(screen.getByText('My Learning Progress')).toBeInTheDocument();
    expect(screen.getByText('Track your progress across all enrolled courses')).toBeInTheDocument();
  });

  it('shows empty state when no courses enrolled', async () => {
    mockProgressApi.getAllProgress.mockResolvedValue([]);

    render(<ProgressDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("You haven't enrolled in any courses yet.")
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Browse Courses' })).toBeInTheDocument();
  });

  it('renders course cards with titles', async () => {
    mockProgressApi.getAllProgress.mockResolvedValue(mockProgressList);

    render(<ProgressDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    });
    expect(screen.getByText('Advanced TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js Basics')).toBeInTheDocument();
  });

  it('displays progress percentages on cards', async () => {
    mockProgressApi.getAllProgress.mockResolvedValue(mockProgressList);

    render(<ProgressDashboard />);

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('displays lesson counts on cards', async () => {
    mockProgressApi.getAllProgress.mockResolvedValue(mockProgressList);

    render(<ProgressDashboard />);

    await waitFor(() => {
      expect(screen.getByText('20 / 20')).toBeInTheDocument();
    });
    expect(screen.getByText('15 / 30')).toBeInTheDocument();
    expect(screen.getByText('0 / 10')).toBeInTheDocument();
  });

  it('shows COMPLETED badge for 100% progress courses', async () => {
    mockProgressApi.getAllProgress.mockResolvedValue(mockProgressList);

    render(<ProgressDashboard />);

    await waitFor(() => {
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });
  });

  it('renders stats row with correct counts', async () => {
    mockProgressApi.getAllProgress.mockResolvedValue(mockProgressList);

    render(<ProgressDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Courses')).toBeInTheDocument();
    });
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Not Started')).toBeInTheDocument();
  });

  it('displays average quiz scores when available', async () => {
    mockProgressApi.getAllProgress.mockResolvedValue(mockProgressList);

    render(<ProgressDashboard />);

    await waitFor(() => {
      expect(screen.getByText('92%')).toBeInTheDocument();
    });
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('displays last activity dates', async () => {
    mockProgressApi.getAllProgress.mockResolvedValue(mockProgressList);

    render(<ProgressDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument();
    });
    expect(screen.getByText('Mar 20, 2024')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('shows error message when API fails', async () => {
    mockProgressApi.getAllProgress.mockRejectedValue({
      response: { data: { error: 'Failed to load progress' } },
    });

    render(<ProgressDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load progress')).toBeInTheDocument();
    });
  });

  it('shows default error message when API fails without detail', async () => {
    mockProgressApi.getAllProgress.mockRejectedValue(new Error('Network error'));

    render(<ProgressDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load progress')).toBeInTheDocument();
    });
  });
});
