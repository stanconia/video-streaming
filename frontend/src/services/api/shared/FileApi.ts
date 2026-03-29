import axios, { AxiosInstance } from 'axios';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class FileApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({ baseURL });

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

  async uploadFile(file: File, roomId: string, userId: string): Promise<{
    fileId: string; fileName: string; fileSize: number; fileType: string; downloadUrl: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', roomId);
    formData.append('userId', userId);
    const response = await this.client.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}

export const fileApi = new FileApi();
