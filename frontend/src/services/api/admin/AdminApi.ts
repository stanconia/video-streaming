import axios, { AxiosInstance } from 'axios';
import { PlatformStats, TeacherApplication, AdminUserPage } from '../../../types/admin/admin.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class AdminApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getStats(): Promise<PlatformStats> {
    const response = await this.client.get<PlatformStats>('/admin/stats');
    return response.data;
  }

  async getApplications(status?: string): Promise<TeacherApplication[]> {
    const params = status ? { status } : {};
    const response = await this.client.get<TeacherApplication[]>('/admin/teacher-applications', { params });
    return response.data;
  }

  async approveApplication(id: string): Promise<TeacherApplication> {
    const response = await this.client.put<TeacherApplication>(`/admin/teacher-applications/${id}/approve`);
    return response.data;
  }

  async rejectApplication(id: string): Promise<TeacherApplication> {
    const response = await this.client.put<TeacherApplication>(`/admin/teacher-applications/${id}/reject`);
    return response.data;
  }

  async getUsers(page = 0, size = 20): Promise<AdminUserPage> {
    const response = await this.client.get<AdminUserPage>('/admin/users', { params: { page, size } });
    return response.data;
  }

  async changeUserRole(userId: string, role: string): Promise<any> {
    const response = await this.client.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  }
}

export const adminApi = new AdminApi();
