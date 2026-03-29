import axios, { AxiosInstance } from 'axios';
import { LiveSession, CreateLiveSessionRequest } from '../../../types/live/liveSession.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class LiveSessionApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem('edulive_user');
          window.location.href = '/login';
          return new Promise(() => {});
        }
        return Promise.reject(error);
      }
    );
  }

  async createSession(request: CreateLiveSessionRequest): Promise<LiveSession> {
    const response = await this.client.post<LiveSession>('/live-sessions', request);
    return response.data;
  }

  async getSessionsForCourse(courseId: string): Promise<LiveSession[]> {
    const response = await this.client.get<LiveSession[]>('/live-sessions', {
      params: { courseId },
    });
    return response.data;
  }

  async getSessionsForModule(courseId: string, moduleId: string): Promise<LiveSession[]> {
    const response = await this.client.get<LiveSession[]>('/live-sessions', {
      params: { courseId, moduleId },
    });
    return response.data;
  }

  async getSession(sessionId: string): Promise<LiveSession> {
    const response = await this.client.get<LiveSession>(`/live-sessions/${sessionId}`);
    return response.data;
  }

  async getMyUpcoming(): Promise<LiveSession[]> {
    const response = await this.client.get<LiveSession[]>('/live-sessions/my-upcoming');
    return response.data;
  }

  async getMyTeaching(): Promise<LiveSession[]> {
    const response = await this.client.get<LiveSession[]>('/live-sessions/my-teaching');
    return response.data;
  }

  async startSession(sessionId: string): Promise<LiveSession> {
    const response = await this.client.post<LiveSession>(`/live-sessions/${sessionId}/start`);
    return response.data;
  }

  async endSession(sessionId: string): Promise<LiveSession> {
    const response = await this.client.post<LiveSession>(`/live-sessions/${sessionId}/end`);
    return response.data;
  }

  async cancelSession(sessionId: string): Promise<void> {
    await this.client.delete(`/live-sessions/${sessionId}`);
  }
}

export const liveSessionApi = new LiveSessionApi();
