import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResetPasswordPage } from './ResetPasswordPage';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSearchParams = new URLSearchParams();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [mockSearchParams],
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams.delete('token');
});

describe('ResetPasswordPage', () => {
  describe('when no token is provided', () => {
    it('shows invalid reset link error', () => {
      render(<ResetPasswordPage />);

      expect(
        screen.getByText('Invalid reset link. Please request a new password reset.')
      ).toBeInTheDocument();
    });

    it('shows link to request a new reset', () => {
      render(<ResetPasswordPage />);

      const link = screen.getByText('Request New Reset Link');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('when token is provided', () => {
    beforeEach(() => {
      mockSearchParams.set('token', 'valid-reset-token');
    });

    it('renders password and confirm password inputs', () => {
      render(<ResetPasswordPage />);

      expect(screen.getByText('New Password')).toBeInTheDocument();
      expect(screen.getByText('Confirm Password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter new password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
    });

    it('shows password mismatch text when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordPage />);

      await user.type(screen.getByPlaceholderText('Enter new password'), 'Password123!');
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'Different');

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('does not show mismatch text when passwords match', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordPage />);

      await user.type(screen.getByPlaceholderText('Enter new password'), 'Password123!');
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'Password123!');

      expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
    });

    it('shows password strength indicator when typing', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordPage />);

      await user.type(screen.getByPlaceholderText('Enter new password'), 'Ab1!abcdefgh');

      await waitFor(() => {
        expect(screen.getByText(/strong/i)).toBeInTheDocument();
      });
    });

    it('shows "Too short" for passwords under 8 characters', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordPage />);

      await user.type(screen.getByPlaceholderText('Enter new password'), 'short');

      expect(screen.getByText('Too short')).toBeInTheDocument();
    });

    it('submits the form and calls the API on valid input', async () => {
      mockedAxios.post.mockResolvedValue({});
      const user = userEvent.setup();

      render(<ResetPasswordPage />);

      await user.type(screen.getByPlaceholderText('Enter new password'), 'NewPassword123!');
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: 'Reset Password' }));

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/auth/reset-password'),
          { token: 'valid-reset-token', newPassword: 'NewPassword123!' }
        );
      });
    });

    it('shows success message after successful reset', async () => {
      mockedAxios.post.mockResolvedValue({});
      const user = userEvent.setup();

      render(<ResetPasswordPage />);

      await user.type(screen.getByPlaceholderText('Enter new password'), 'NewPassword123!');
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: 'Reset Password' }));

      await waitFor(() => {
        expect(
          screen.getByText('Your password has been reset successfully.')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('shows error message when API call fails', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { data: { error: 'Token expired' } },
      });
      const user = userEvent.setup();

      render(<ResetPasswordPage />);

      await user.type(screen.getByPlaceholderText('Enter new password'), 'NewPassword123!');
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: 'Reset Password' }));

      await waitFor(() => {
        expect(screen.getByText('Token expired')).toBeInTheDocument();
      });
    });

    it('shows default error message when API error has no detail', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();

      render(<ResetPasswordPage />);

      await user.type(screen.getByPlaceholderText('Enter new password'), 'NewPassword123!');
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: 'Reset Password' }));

      await waitFor(() => {
        expect(
          screen.getByText('Password reset failed. The link may be expired or invalid.')
        ).toBeInTheDocument();
      });
    });

    it('shows "Resetting..." while submitting', async () => {
      mockedAxios.post.mockImplementation(() => new Promise(() => {}));
      const user = userEvent.setup();

      render(<ResetPasswordPage />);

      await user.type(screen.getByPlaceholderText('Enter new password'), 'NewPassword123!');
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: 'Reset Password' }));

      await waitFor(() => {
        expect(screen.getByText('Resetting...')).toBeInTheDocument();
      });
    });

    it('renders "Back to Sign In" link', () => {
      render(<ResetPasswordPage />);

      const link = screen.getByText('Back to Sign In');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/login');
    });
  });
});
