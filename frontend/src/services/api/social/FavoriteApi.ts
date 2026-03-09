import axios, { AxiosInstance } from 'axios';
import { FavoriteTeacher, SavedClass } from '../../../types/social/favorites.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class FavoriteApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async toggleFavoriteTeacher(teacherUserId: string): Promise<{ favorited: boolean }> {
    const response = await this.client.post<{ favorited: boolean }>(`/favorites/teachers/${teacherUserId}`);
    return response.data;
  }

  async getFavoriteTeachers(): Promise<FavoriteTeacher[]> {
    const response = await this.client.get<FavoriteTeacher[]>('/favorites/teachers');
    return response.data;
  }

  async isFavoriteTeacher(teacherUserId: string): Promise<boolean> {
    const response = await this.client.get<{ favorited: boolean }>(`/favorites/teachers/${teacherUserId}/status`);
    return response.data.favorited;
  }

  async toggleSavedClass(classId: string): Promise<{ saved: boolean }> {
    const response = await this.client.post<{ saved: boolean }>(`/favorites/classes/${classId}`);
    return response.data;
  }

  async getSavedClasses(): Promise<SavedClass[]> {
    const response = await this.client.get<SavedClass[]>('/favorites/classes');
    return response.data;
  }

  async isSavedClass(classId: string): Promise<boolean> {
    const response = await this.client.get<{ saved: boolean }>(`/favorites/classes/${classId}/status`);
    return response.data.saved;
  }
}

export const favoriteApi = new FavoriteApi();
