import axios, { AxiosInstance } from 'axios';
import { TeacherDashboardData, StudentDashboardData, CourseAnalytics, StudentPerformance } from '../../../types/admin/dashboard.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class DashboardApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getTeacherDashboard(): Promise<TeacherDashboardData> {
    const response = await this.client.get<TeacherDashboardData>('/dashboard/teacher');
    return response.data;
  }

  async getStudentDashboard(): Promise<StudentDashboardData> {
    const response = await this.client.get<StudentDashboardData>('/dashboard/student');
    return response.data;
  }

  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    const response = await this.client.get<CourseAnalytics>(`/dashboard/courses/${courseId}/analytics`);
    return response.data;
  }

  async getCourseStudents(courseId: string): Promise<StudentPerformance[]> {
    const response = await this.client.get<StudentPerformance[]>(`/dashboard/courses/${courseId}/students`);
    return response.data;
  }
}

export const dashboardApi = new DashboardApi();
