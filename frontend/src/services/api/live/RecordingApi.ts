import axios, { AxiosInstance } from 'axios';
import { Recording, StartRecordingRequest, StopRecordingRequest } from '../../../types/live/recording.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class RecordingApi {
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

  async startRecording(request: StartRecordingRequest): Promise<Recording> {
    const response = await this.client.post<Recording>('/recordings/start', request);
    return response.data;
  }

  async stopRecording(request: StopRecordingRequest): Promise<Recording> {
    const response = await this.client.post<Recording>('/recordings/stop', request);
    return response.data;
  }

  async getRecording(id: string): Promise<Recording> {
    const response = await this.client.get<Recording>(`/recordings/${id}`);
    return response.data;
  }

  async getRecordings(roomId?: string): Promise<Recording[]> {
    const params = roomId ? { roomId } : {};
    const response = await this.client.get<Recording[]>('/recordings', { params });
    return response.data;
  }

  async getPlaybackUrl(id: string): Promise<string> {
    const response = await this.client.get<{ url: string }>(`/recordings/${id}/playback`);
    return response.data.url;
  }

  async transcribeRecording(id: string): Promise<{ message: string; recordingId: string }> {
    const response = await this.client.post<{ message: string; recordingId: string }>(
      `/recordings/${id}/transcribe`
    );
    return response.data;
  }

  async getCaptionUrl(id: string): Promise<string | null> {
    try {
      const response = await this.client.get<{ url: string }>(`/recordings/${id}/captions`);
      return response.data.url;
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }
}

export const recordingApi = new RecordingApi();
