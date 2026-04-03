import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ForgotPasswordPage', () => {
  it('renders the form with email input and submit button', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
  });

  it('renders informational text', () => {
    render(<ForgotPasswordPage />);

    expect(
      screen.getByText("Enter your email address and we'll send you a link to reset your password.")
    ).toBeInTheDocument();
  });

  it('allows typing into the email input', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('calls the API and shows success message on submit', async () => {
    mockedAxios.post.mockResolvedValue({});
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/forgot-password'),
        { email: 'test@example.com' }
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText("If an account exists with this email, you'll receive a reset link.")
      ).toBeInTheDocument();
    });
  });

  it('shows success message even on API error to avoid leaking email existence', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Server error'));
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'bad@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(
        screen.getByText("If an account exists with this email, you'll receive a reset link.")
      ).toBeInTheDocument();
    });
  });

  it('shows "Sending..." text while submitting', async () => {
    mockedAxios.post.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });
  });

  it('renders "Back to Sign In" link after successful submit', async () => {
    mockedAxios.post.mockResolvedValue({});
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      const backLink = screen.getByText('Back to Sign In');
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/login');
    });
  });

  it('renders "Sign In" link on the form view', () => {
    render(<ForgotPasswordPage />);

    const signInLink = screen.getByText('Sign In');
    expect(signInLink).toBeInTheDocument();
    expect(signInLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('renders the MindMint title', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByText('MindMint')).toBeInTheDocument();
  });
});
