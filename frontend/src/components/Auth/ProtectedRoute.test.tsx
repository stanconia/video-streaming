import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// We need to track Navigate calls
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: (props: any) => {
    mockNavigate(props);
    return null;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProtectedRoute', () => {
  it('renders children when user is authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        userId: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'STUDENT',
      },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /login when user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/login', replace: true })
    );
  });

  it('shows loading state while authentication is being checked', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('blocks access for wrong role when allowedRoles is specified', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        userId: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'STUDENT',
      },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
          <div>Teacher Only Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Teacher Only Content')).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/', replace: true })
    );
  });

  it('allows access when user role matches allowedRoles', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        userId: 'user-1',
        email: 'teacher@example.com',
        displayName: 'Teacher User',
        role: 'TEACHER',
      },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['TEACHER']}>
          <div>Teacher Only Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Teacher Only Content')).toBeInTheDocument();
  });

  it('allows access when allowedRoles is not specified (any authenticated user)', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        userId: 'user-1',
        email: 'admin@example.com',
        displayName: 'Admin User',
        role: 'ADMIN',
      },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Any Authenticated User Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Any Authenticated User Content')).toBeInTheDocument();
  });
});
