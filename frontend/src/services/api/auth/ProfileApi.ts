import axios, { AxiosInstance } from 'axios';
import { UserProfile, UpdateProfileRequest } from '../../../types/auth/profile.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class ProfileApi {
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
      (error) => Promise.reject(error)
    );
  }

  async getMyProfile(): Promise<UserProfile> {
    const response = await this.client.get<UserProfile>('/users/me');
    return response.data;
  }

  async updateMyProfile(request: UpdateProfileRequest): Promise<UserProfile> {
    const response = await this.client.put<UserProfile>('/users/me', request);
    return response.data;
  }

  async getPublicProfile(userId: string): Promise<UserProfile> {
    const response = await this.client.get<UserProfile>(`/users/${userId}`);
    return response.data;
  }

  async uploadProfileImage(file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post<UserProfile>('/users/me/profile-image', formData, {
      headers: { 'Content-Type': undefined as any },
    });
    return response.data;
  }
}

export const profileApi = new ProfileApi();
