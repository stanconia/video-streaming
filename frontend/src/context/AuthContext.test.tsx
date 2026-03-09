import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi } from '../services/api/auth/AuthApi';

jest.mock('../services/api/auth/AuthApi', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
  },
}));

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

const mockAuthResponse = {
  token: 'test-token-123',
  userId: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'STUDENT' as const,
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('AuthContext', () => {
  it('renders children when wrapped in AuthProvider', () => {
    render(
      <AuthProvider>
        <div>Child Content</div>
      </AuthProvider>
    );
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('login stores token and user in state and localStorage', async () => {
    mockAuthApi.login.mockResolvedValue(mockAuthResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password123' });
    });

    expect(mockAuthApi.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.current.token).toBe('test-token-123');
    expect(result.current.user).toEqual({
      userId: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'STUDENT',
    });
    expect(localStorage.getItem('edulive_token')).toBe('test-token-123');
    expect(JSON.parse(localStorage.getItem('edulive_user')!)).toEqual({
      userId: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'STUDENT',
    });
  });

  it('register stores token and user', async () => {
    const registerResponse = {
      ...mockAuthResponse,
      role: 'TEACHER' as const,
    };
    mockAuthApi.register.mockResolvedValue(registerResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        role: 'TEACHER',
      });
    });

    expect(mockAuthApi.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
      role: 'TEACHER',
    });
    expect(result.current.token).toBe('test-token-123');
    expect(result.current.user).toEqual({
      userId: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'TEACHER',
    });
    expect(localStorage.getItem('edulive_token')).toBe('test-token-123');
  });

  it('loginWithGoogle stores token and user', async () => {
    mockAuthApi.loginWithGoogle.mockResolvedValue(mockAuthResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.loginWithGoogle('google-credential-token');
    });

    expect(mockAuthApi.loginWithGoogle).toHaveBeenCalledWith('google-credential-token');
    expect(result.current.token).toBe('test-token-123');
    expect(result.current.user).toEqual({
      userId: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'STUDENT',
    });
    expect(localStorage.getItem('edulive_token')).toBe('test-token-123');
  });

  it('logout clears token and user from state and localStorage', async () => {
    mockAuthApi.login.mockResolvedValue(mockAuthResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // First login
    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password123' });
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.token).not.toBeNull();

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('edulive_token')).toBeNull();
    expect(localStorage.getItem('edulive_user')).toBeNull();
  });

  it('restores session from localStorage on mount', async () => {
    const savedUser = {
      userId: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'STUDENT',
    };
    localStorage.setItem('edulive_token', 'saved-token');
    localStorage.setItem('edulive_user', JSON.stringify(savedUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for the useEffect to run
    await act(async () => {
      // Allow effects to flush
    });

    expect(result.current.token).toBe('saved-token');
    expect(result.current.user).toEqual(savedUser);
    expect(result.current.isLoading).toBe(false);
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
