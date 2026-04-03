import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { StudentDashboard } from './StudentDashboard';
import { dashboardApi } from '../../services/api/admin/DashboardApi';
import { liveSessionApi } from '../../services/api/live/LiveSessionApi';

jest.mock('../../services/api/admin/DashboardApi', () => ({
  dashboardApi: {
    getStudentDashboard: jest.fn(),
  },
}));

jest.mock('../../services/api/live/LiveSessionApi', () => ({
  liveSessionApi: {
    getMyUpcoming: jest.fn(),
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(() => jest.fn()),
}));

jest.mock('./StatCard', () => ({
  StatCard: ({ label, value }: { label: string; value: string | number }) => (
    <div data-testid={`stat-${label}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));

const mockDashboardApi = dashboardApi as jest.Mocked<typeof dashboardApi>;
const mockLiveSessionApi = liveSessionApi as jest.Mocked<typeof liveSessionApi>;

const mockDashboardData = {
  totalEnrollments: 8,
  activeEnrollments: 5,
  completedCourses: 3,
  totalSpent: 149.99,
  recentEnrollments: [
    {
      id: 'enroll-1',
      courseId: 'course-1',
      courseTitle: 'React Basics',
      studentUserId: 'student-1',
      studentDisplayName: 'Student User',
      status: 'ACTIVE',
      paidAmount: 29.99,
      progressPercentage: 65,
      enrolledAt: '2024-01-15T00:00:00Z',
      completedAt: null,
    },
    {
      id: 'enroll-2',
      courseId: 'course-2',
      courseTitle: 'TypeScript Deep Dive',
      studentUserId: 'student-1',
      studentDisplayName: 'Student User',
      status: 'COMPLETED',
      paidAmount: 49.99,
      progressPercentage: 100,
      enrolledAt: '2024-01-01T00:00:00Z',
      completedAt: '2024-02-01T00:00:00Z',
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockLiveSessionApi.getMyUpcoming.mockResolvedValue([]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('StudentDashboard', () => {
  it('renders dashboard with stats', async () => {
    mockDashboardApi.getStudentDashboard.mockResolvedValue(mockDashboardData);

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Mind Learner Dashboard')).toBeInTheDocument();
    });

    // Check stat cards
    expect(screen.getByTestId('stat-Total Enrollments')).toBeInTheDocument();
    expect(screen.getByTestId('stat-Active Courses')).toBeInTheDocument();
    expect(screen.getByTestId('stat-Completed')).toBeInTheDocument();
    expect(screen.getByTestId('stat-Total Spent')).toBeInTheDocument();

    // Check stat values
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    mockDashboardApi.getStudentDashboard.mockImplementation(() => new Promise(() => {}));

    render(<StudentDashboard />);

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('shows error when API call fails', async () => {
    mockDashboardApi.getStudentDashboard.mockRejectedValue({
      response: { data: { error: 'Failed to load dashboard' } },
    });

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
    });
  });

  it('renders recent enrollments section', async () => {
    mockDashboardApi.getStudentDashboard.mockResolvedValue(mockDashboardData);

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Enrollments')).toBeInTheDocument();
    });

    expect(screen.getByText('React Basics')).toBeInTheDocument();
    expect(screen.getByText('TypeScript Deep Dive')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows empty state when no enrollments', async () => {
    mockDashboardApi.getStudentDashboard.mockResolvedValue({
      ...mockDashboardData,
      recentEnrollments: [],
    });

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No enrollments yet. Browse courses to get started.')).toBeInTheDocument();
    });
  });

  it('renders quick action links', async () => {
    mockDashboardApi.getStudentDashboard.mockResolvedValue(mockDashboardData);

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Browse Courses')).toBeInTheDocument();
    });

    expect(screen.getByText('My Enrollments')).toBeInTheDocument();
  });

  it('calls getStudentDashboard on mount', () => {
    mockDashboardApi.getStudentDashboard.mockImplementation(() => new Promise(() => {}));

    render(<StudentDashboard />);

    expect(mockDashboardApi.getStudentDashboard).toHaveBeenCalledTimes(1);
  });
});
