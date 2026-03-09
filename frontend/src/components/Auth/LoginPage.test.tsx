import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';
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
  GoogleLogin: ({ onSuccess, onError }: any) => (
    <button
      data-testid="google-login"
      onClick={() => onSuccess({ credential: 'test-google-token' })}
    >
      Google Login
    </button>
  ),
}));

const mockLogin = jest.fn();
const mockLoginWithGoogle = jest.fn();
const mockNavigate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({
    login: mockLogin,
    loginWithGoogle: mockLoginWithGoogle,
  });
  (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
});

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<LoginPage />);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('submits login form with email and password', async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'user@test.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'mypassword');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'mypassword',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'user@test.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows default error message when no error detail is provided', async () => {
    mockLogin.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'user@test.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('renders Google login button', () => {
    render(<LoginPage />);

    expect(screen.getByTestId('google-login')).toBeInTheDocument();
  });

  it('handles Google login success', async () => {
    mockLoginWithGoogle.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.click(screen.getByTestId('google-login'));

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalledWith('test-google-token');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('renders link to register page', () => {
    render(<LoginPage />);

    const registerLink = screen.getByText('Register');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('disables submit button while submitting', async () => {
    // Make login take time
    mockLogin.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'user@test.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });
  });
});
