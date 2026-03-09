import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterPage } from './RegisterPage';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

jest.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }: any) => (
    <button
      data-testid="google-signup"
      onClick={() => onSuccess({ credential: 'test-google-token' })}
    >
      Google Signup
    </button>
  ),
}));

const mockRegister = jest.fn();
const mockLoginWithGoogle = jest.fn();
const mockNavigate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({
    register: mockRegister,
    loginWithGoogle: mockLoginWithGoogle,
  });
  (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
});

describe('RegisterPage', () => {
  it('renders form with name, email, password, and role fields', () => {
    render(<RegisterPage />);

    expect(screen.getByText('Display Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('At least 6 characters')).toBeInTheDocument();
    expect(screen.getByLabelText('Teacher')).toBeInTheDocument();
    expect(screen.getByLabelText('Student')).toBeInTheDocument();
  });

  it('submits registration with form data', async () => {
    mockRegister.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText('Your name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'john@test.com');
    await user.type(screen.getByPlaceholderText('At least 6 characters'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'John Doe',
          email: 'john@test.com',
          password: 'password123',
          role: 'STUDENT',
        })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows teacher-specific fields when TEACHER role selected', async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    // Initially, teacher fields should not be visible (STUDENT is default)
    expect(screen.queryByText('Teacher Details')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. Math tutor with 10 years experience')).not.toBeInTheDocument();

    // Select Teacher role
    await user.click(screen.getByLabelText('Teacher'));

    // Now teacher-specific fields should appear
    expect(screen.getByText('Teacher Details')).toBeInTheDocument();
    expect(screen.getByText('Headline')).toBeInTheDocument();
    expect(screen.getByText('Subjects')).toBeInTheDocument();
    expect(screen.getByText('Years of Experience')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Math tutor with 10 years experience')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Math, Physics, Chemistry')).toBeInTheDocument();
  });

  it('submits registration with teacher-specific fields', async () => {
    mockRegister.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText('Your name'), 'Jane Teacher');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'jane@test.com');
    await user.type(screen.getByPlaceholderText('At least 6 characters'), 'password123');

    // Select Teacher role
    await user.click(screen.getByLabelText('Teacher'));

    // Fill teacher-specific fields
    await user.type(
      screen.getByPlaceholderText('e.g. Math tutor with 10 years experience'),
      'Expert Math Teacher'
    );
    await user.type(
      screen.getByPlaceholderText('e.g. Math, Physics, Chemistry'),
      'Math,Science'
    );
    await user.type(screen.getByPlaceholderText('0'), '5');

    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'Jane Teacher',
          email: 'jane@test.com',
          password: 'password123',
          role: 'TEACHER',
          headline: 'Expert Math Teacher',
          subjects: 'Math,Science',
          experienceYears: 5,
        })
      );
    });
  });

  it('renders Google signup button', () => {
    render(<RegisterPage />);

    expect(screen.getByTestId('google-signup')).toBeInTheDocument();
  });

  it('handles Google signup success', async () => {
    mockLoginWithGoogle.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.click(screen.getByTestId('google-signup'));

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalledWith('test-google-token');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error message on registration failure', async () => {
    mockRegister.mockRejectedValue({
      response: { data: { error: 'Email already taken' } },
    });
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText('Your name'), 'John');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'taken@test.com');
    await user.type(screen.getByPlaceholderText('At least 6 characters'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Email already taken')).toBeInTheDocument();
    });
  });

  it('renders link to login page', () => {
    render(<RegisterPage />);

    const loginLink = screen.getByText('Sign In');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('shows student-specific subject interests field for STUDENT role', () => {
    render(<RegisterPage />);

    expect(screen.getByText('Subject Interests')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Math, Science, History')).toBeInTheDocument();
  });

  it('hides subject interests when switching to TEACHER role', async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    // Subject interests visible for STUDENT
    expect(screen.getByPlaceholderText('e.g. Math, Science, History')).toBeInTheDocument();

    // Switch to TEACHER
    await user.click(screen.getByLabelText('Teacher'));

    // Subject interests should be hidden
    expect(screen.queryByPlaceholderText('e.g. Math, Science, History')).not.toBeInTheDocument();
  });
});
