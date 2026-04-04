import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', isDark: false, toggleTheme: jest.fn() }),
}));

jest.mock('../Notification/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell">Notification Bell</div>,
}));

const mockLogout = jest.fn();

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Navbar', () => {
  it('renders nothing when user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      logout: mockLogout,
    });

    const { container } = renderWithRouter(<Navbar />);

    expect(container.querySelector('nav')).toBeNull();
  });

  it('renders navigation links for authenticated user', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        userId: 'user-1',
        email: 'student@test.com',
        displayName: 'Student User',
        role: 'STUDENT',
      },
      logout: mockLogout,
    });

    renderWithRouter(<Navbar />);

    expect(screen.getByText('KyroAcademy')).toBeInTheDocument();
    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('Guides')).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Recordings')).toBeInTheDocument();
    expect(screen.getByText('Student User')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });

  it('shows teacher-specific Dashboard link for TEACHER role', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        userId: 'teacher-1',
        email: 'teacher@test.com',
        displayName: 'Teacher User',
        role: 'TEACHER',
      },
      logout: mockLogout,
    });

    renderWithRouter(<Navbar />);

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Courses')).toBeInTheDocument();
  });

  it('does not show Dashboard link for STUDENT role', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        userId: 'student-1',
        email: 'student@test.com',
        displayName: 'Student User',
        role: 'STUDENT',
      },
      logout: mockLogout,
    });

    renderWithRouter(<Navbar />);

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Courses')).toBeInTheDocument();
  });

  it('shows Admin link for ADMIN role', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        userId: 'admin-1',
        email: 'admin@test.com',
        displayName: 'Admin User',
        role: 'ADMIN',
      },
      logout: mockLogout,
    });

    renderWithRouter(<Navbar />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('logout button calls logout function', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        userId: 'user-1',
        email: 'test@test.com',
        displayName: 'Test User',
        role: 'STUDENT',
      },
      logout: mockLogout,
    });

    const user = userEvent.setup();

    renderWithRouter(<Navbar />);

    await user.click(screen.getByText('Logout'));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
