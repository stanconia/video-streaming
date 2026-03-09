import axios, { AxiosInstance } from 'axios';
import { TeacherProfile, TeacherProfileRequest, Review, CreateReviewRequest } from '../../../types/social/teacher.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class TeacherApi {
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
        }
        return Promise.reject(error);
      }
    );
  }

  async getMyProfile(): Promise<TeacherProfile> {
    const response = await this.client.get<TeacherProfile>('/teachers/profile');
    return response.data;
  }

  async updateProfile(request: TeacherProfileRequest): Promise<TeacherProfile> {
    const response = await this.client.put<TeacherProfile>('/teachers/profile', request);
    return response.data;
  }

  async getTeacherProfile(userId: string): Promise<TeacherProfile> {
    const response = await this.client.get<TeacherProfile>(`/teachers/${userId}`);
    return response.data;
  }

  async searchTeachers(subject?: string, query?: string): Promise<TeacherProfile[]> {
    const params: Record<string, string> = {};
    if (subject) params.subject = subject;
    if (query) params.query = query;
    const response = await this.client.get<TeacherProfile[]>('/teachers', { params });
    return response.data;
  }

  async getReviews(teacherId: string): Promise<Review[]> {
    const response = await this.client.get<Review[]>('/reviews', { params: { teacherId } });
    return response.data;
  }

  async createReview(teacherId: string, request: CreateReviewRequest): Promise<Review> {
    const response = await this.client.post<Review>('/reviews', request, { params: { teacherId } });
    return response.data;
  }

  async replyToReview(reviewId: string, reply: string): Promise<Review> {
    const response = await this.client.post<Review>(`/reviews/${reviewId}/reply`, { reply });
    return response.data;
  }

  async markHelpful(reviewId: string): Promise<Review> {
    const response = await this.client.post<Review>(`/reviews/${reviewId}/helpful`);
    return response.data;
  }
}

export const teacherApi = new TeacherApi();
