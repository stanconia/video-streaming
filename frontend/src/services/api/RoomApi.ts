import axios, { AxiosInstance } from 'axios';
import { Room, Participant } from '../../types/room.types';

export class RoomApi {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
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
