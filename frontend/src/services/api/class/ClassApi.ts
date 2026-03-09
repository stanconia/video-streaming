import axios, { AxiosInstance } from 'axios';
import { ScheduledClass, CreateClassRequest } from '../../../types/class/class.types';
import { SearchFilters, SearchResult } from '../../../types/admin/search.types';
import { WaitlistEntry } from '../../../types/class/waitlist.types';
import { AttendanceRecord } from '../../../types/class/attendance.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class ClassApi {
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

  async createClass(request: CreateClassRequest): Promise<ScheduledClass> {
    const response = await this.client.post<ScheduledClass>('/classes', request);
    return response.data;
  }

  async getUpcomingClasses(subject?: string): Promise<ScheduledClass[]> {
    const params = subject ? { subject } : {};
    const response = await this.client.get<ScheduledClass[]>('/classes', { params });
    return response.data;
  }

  async getClass(classId: string): Promise<ScheduledClass> {
    const response = await this.client.get<ScheduledClass>(`/classes/${classId}`);
    return response.data;
  }

  async getMyClasses(): Promise<ScheduledClass[]> {
    const response = await this.client.get<ScheduledClass[]>('/classes/my-classes');
    return response.data;
  }

  async startClass(classId: string): Promise<ScheduledClass> {
    const response = await this.client.post<ScheduledClass>(`/classes/${classId}/start`);
    return response.data;
  }

  async cancelClass(classId: string): Promise<ScheduledClass> {
    const response = await this.client.delete<ScheduledClass>(`/classes/${classId}`);
    return response.data;
  }

  async searchClasses(filters: SearchFilters): Promise<SearchResult<ScheduledClass>> {
    const params: Record<string, any> = {};
    if (filters.query) params.q = filters.query;
    if (filters.subject) params.subject = filters.subject;
    if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
    if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
    if (filters.minAge !== undefined) params.minAge = filters.minAge;
    if (filters.maxAge !== undefined) params.maxAge = filters.maxAge;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.minRating !== undefined) params.minRating = filters.minRating;
    if (filters.sortBy) params.sort = filters.sortBy;
    if (filters.sortDir) params.dir = filters.sortDir;
    if (filters.page !== undefined) params.page = filters.page;
    if (filters.size !== undefined) params.size = filters.size;
    const response = await this.client.get<SearchResult<ScheduledClass>>('/classes/search', { params });
    return response.data;
  }

  async joinWaitlist(classId: string): Promise<WaitlistEntry> {
    const response = await this.client.post<WaitlistEntry>(`/classes/${classId}/waitlist`);
    return response.data;
  }

  async leaveWaitlist(classId: string): Promise<void> {
    await this.client.delete(`/classes/${classId}/waitlist`);
  }

  async getWaitlist(classId: string): Promise<WaitlistEntry[]> {
    const response = await this.client.get<WaitlistEntry[]>(`/classes/${classId}/waitlist`);
    return response.data;
  }

  async getAttendance(classId: string): Promise<AttendanceRecord[]> {
    const response = await this.client.get<AttendanceRecord[]>(`/classes/${classId}/attendance`);
    return response.data;
  }
}

export const classApi = new ClassApi();
