import axios, { AxiosInstance } from 'axios';
import { NotificationPage } from '../../../types/social/notification.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class NotificationApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getNotifications(page = 0, size = 20): Promise<NotificationPage> {
    const response = await this.client.get<NotificationPage>('/notifications', { params: { page, size } });
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await this.client.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  }

  async markAsRead(id: string): Promise<void> {
    await this.client.put(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await this.client.put('/notifications/read-all');
  }
}

export const notificationApi = new NotificationApi();
