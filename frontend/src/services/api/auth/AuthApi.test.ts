import axios from 'axios';
import { AuthApi } from './AuthApi';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthApi', () => {
  let authApi: AuthApi;

  beforeEach(() => {
    (mockedAxios.post as jest.Mock).mockClear();
    authApi = new AuthApi();
  });

  describe('login', () => {
    it('calls POST /api/auth/login with correct body', async () => {
      const mockResponse = {
        data: {
          token: 'jwt-token',
          userId: 'user-1',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'STUDENT',
        },
      };
      (mockedAxios.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('propagates errors from the API', async () => {
      const error = new Error('Network error');
      (mockedAxios.post as jest.Mock).mockRejectedValue(error);

      await expect(
        authApi.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('register', () => {
    it('calls POST /api/auth/register with correct body', async () => {
      const mockResponse = {
        data: {
          token: 'jwt-token',
          userId: 'user-2',
          email: 'new@example.com',
          displayName: 'New User',
          role: 'TEACHER',
        },
      };
      (mockedAxios.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.register({
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User',
        role: 'TEACHER',
        dateOfBirth: '1990-01-01',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/register', {
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User',
        role: 'TEACHER',
        dateOfBirth: '1990-01-01',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('loginWithGoogle', () => {
    it('calls POST /api/auth/google with credential', async () => {
      const mockResponse = {
        data: {
          token: 'jwt-token',
          userId: 'user-4',
          email: 'google@example.com',
          displayName: 'Google User',
          role: 'STUDENT',
        },
      };
      (mockedAxios.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.loginWithGoogle('google-id-token-123');

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/google', {
        credential: 'google-id-token-123',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
