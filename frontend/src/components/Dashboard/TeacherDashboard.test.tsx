import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TeacherDashboard } from './TeacherDashboard';
import { dashboardApi } from '../../services/api/admin/DashboardApi';

jest.mock('../../services/api/admin/DashboardApi', () => ({
  dashboardApi: {
    getTeacherDashboard: jest.fn(),
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(() => jest.fn()),
}));

// Mock child components that have their own complex dependencies
jest.mock('./StatCard', () => ({
  StatCard: ({ label, value }: { label: string; value: string | number }) => (
    <div data-testid={`stat-${label}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));

jest.mock('./EarningsChart', () => ({
  EarningsChart: ({ data }: { data: any[] }) => (
    <div data-testid="earnings-chart">Earnings Chart ({data.length} months)</div>
  ),
}));

const mockDashboardApi = dashboardApi as jest.Mocked<typeof dashboardApi>;

const mockDashboardData = {
  totalEarnings: 15000.50,
  totalStudents: 250,
  totalClasses: 12,
  upcomingClasses: 3,
  averageRating: 4.7,
  totalReviews: 89,
  monthlyEarnings: [
    { month: 'Jan', amount: 2000 },
    { month: 'Feb', amount: 3000 },
    { month: 'Mar', amount: 2500 },
  ],
  upcomingClassList: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TeacherDashboard', () => {
  it('renders dashboard with stats after loading', async () => {
    mockDashboardApi.getTeacherDashboard.mockResolvedValue(mockDashboardData);

    render(<TeacherDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Mind Pro Dashboard')).toBeInTheDocument();
    });

    // Check stat cards are rendered
    expect(screen.getByTestId('stat-Total Earnings')).toBeInTheDocument();
    expect(screen.getByTestId('stat-Total Mind Learners')).toBeInTheDocument();
    expect(screen.getByTestId('stat-Total Courses')).toBeInTheDocument();
    expect(screen.getByTestId('stat-Avg Rating')).toBeInTheDocument();
    expect(screen.getByTestId('stat-Total Reviews')).toBeInTheDocument();

    // Check stat values
    expect(screen.getByText('$15000.50')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('4.7')).toBeInTheDocument();
    expect(screen.getByText('89')).toBeInTheDocument();

    // Check earnings chart
    expect(screen.getByTestId('earnings-chart')).toBeInTheDocument();
    expect(screen.getByText('Earnings Chart (3 months)')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    mockDashboardApi.getTeacherDashboard.mockImplementation(() => new Promise(() => {}));

    render(<TeacherDashboard />);

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('shows error when API call fails', async () => {
    mockDashboardApi.getTeacherDashboard.mockRejectedValue({
      response: { data: { error: 'Failed to load dashboard' } },
    });

    render(<TeacherDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
    });
  });

  it('renders quick action links', async () => {
    mockDashboardApi.getTeacherDashboard.mockResolvedValue(mockDashboardData);

    render(<TeacherDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Create Course')).toBeInTheDocument();
    });

    expect(screen.getByText('My Courses')).toBeInTheDocument();
    expect(screen.getByText('View Earnings')).toBeInTheDocument();
    expect(screen.getByText('Account Setup')).toBeInTheDocument();
  });

  it('calls getTeacherDashboard on mount', () => {
    mockDashboardApi.getTeacherDashboard.mockImplementation(() => new Promise(() => {}));

    render(<TeacherDashboard />);

    expect(mockDashboardApi.getTeacherDashboard).toHaveBeenCalledTimes(1);
  });
});
