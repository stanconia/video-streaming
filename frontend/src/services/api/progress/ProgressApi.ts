import axios, { AxiosInstance } from 'axios';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export interface LessonProgressItem {
  lessonId: string;
  lessonTitle: string;
  completed: boolean;
  completedAt: string | null;
}

export interface CourseProgressResponse {
  courseId: string;
  courseTitle: string;
  enrollmentId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lessons: LessonProgressItem[];
  averageQuizScore: number | null;
  lastAccessedAt: string | null;
}

export class ProgressApi {
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

  async markLessonComplete(enrollmentId: string, lessonId: string): Promise<LessonProgressItem> {
    const response = await this.client.post<LessonProgressItem>(
      `/progress/${enrollmentId}/lessons/${lessonId}/complete`
    );
    return response.data;
  }

  async getCourseProgress(enrollmentId: string): Promise<CourseProgressResponse> {
    const response = await this.client.get<CourseProgressResponse>(
      `/progress/${enrollmentId}`
    );
    return response.data;
  }

  async getAllProgress(): Promise<CourseProgressResponse[]> {
    const response = await this.client.get<CourseProgressResponse[]>('/progress');
    return response.data;
  }
}

export const progressApi = new ProgressApi();
