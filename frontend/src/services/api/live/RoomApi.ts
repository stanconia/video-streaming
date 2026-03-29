import axios, { AxiosInstance } from 'axios';
import { Room, Participant } from '../../../types/live/room.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class RoomApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Attach JWT token to every request
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Redirect to /login on 401 or 403 (stale token)
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

  async createRoom(name: string): Promise<Room> {
    const response = await this.client.post<Room>('/rooms', { name });
    return response.data;
  }

  async getRooms(): Promise<Room[]> {
    const response = await this.client.get<Room[]>('/rooms');
    return response.data;
  }

  async getRoom(roomId: string): Promise<Room> {
    const response = await this.client.get<Room>(`/rooms/${roomId}`);
    return response.data;
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.client.delete(`/rooms/${roomId}`);
  }

  async getParticipants(roomId: string): Promise<Participant[]> {
    const response = await this.client.get<Participant[]>(`/rooms/${roomId}/participants`);
    return response.data;
  }
}

export const roomApi = new RoomApi();
