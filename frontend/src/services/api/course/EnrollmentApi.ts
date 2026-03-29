import axios, { AxiosInstance } from 'axios';
import { CourseEnrollment, CourseProgress } from '../../../types/course/enrollment.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class EnrollmentApi {
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

  async enroll(courseId: string, paymentIntentId?: string): Promise<CourseEnrollment> {
    const body = paymentIntentId ? { paymentIntentId } : {};
    const response = await this.client.post<CourseEnrollment>(`/courses/${courseId}/enrollments`, body);
    return response.data;
  }

  async cancel(courseId: string, enrollmentId: string): Promise<CourseEnrollment> {
    const response = await this.client.delete<CourseEnrollment>(`/courses/${courseId}/enrollments/${enrollmentId}`);
    return response.data;
  }

  async getMyEnrollments(): Promise<CourseEnrollment[]> {
    const response = await this.client.get<CourseEnrollment[]>('/enrollments/me');
    return response.data;
  }

  async getCourseEnrollments(courseId: string): Promise<CourseEnrollment[]> {
    const response = await this.client.get<CourseEnrollment[]>(`/courses/${courseId}/enrollments`);
    return response.data;
  }

  async getCourseProgress(courseId: string): Promise<CourseProgress> {
    const response = await this.client.get<CourseProgress>(`/courses/${courseId}/progress`);
    return response.data;
  }

  async markLessonComplete(courseId: string, lessonId: string): Promise<void> {
    await this.client.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
  }

  async markLessonIncomplete(courseId: string, lessonId: string): Promise<void> {
    await this.client.delete(`/courses/${courseId}/lessons/${lessonId}/complete`);
  }
}

export const enrollmentApi = new EnrollmentApi();
