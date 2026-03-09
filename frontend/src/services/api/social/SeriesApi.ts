import axios, { AxiosInstance } from 'axios';
import { ClassSeries, CreateSeriesRequest, SeriesEnrollment } from '../../../types/social/series.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class SeriesApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getSeries(): Promise<ClassSeries[]> {
    const response = await this.client.get<ClassSeries[]>('/series');
    return response.data;
  }

  async getSeriesById(id: string): Promise<ClassSeries> {
    const response = await this.client.get<ClassSeries>(`/series/${id}`);
    return response.data;
  }

  async createSeries(request: CreateSeriesRequest): Promise<ClassSeries> {
    const response = await this.client.post<ClassSeries>('/series', request);
    return response.data;
  }

  async getMySeries(): Promise<ClassSeries[]> {
    const response = await this.client.get<ClassSeries[]>('/series/my');
    return response.data;
  }

  async enrollInSeries(seriesId: string): Promise<SeriesEnrollment> {
    const response = await this.client.post<SeriesEnrollment>(`/series/${seriesId}/enroll`);
    return response.data;
  }
}

export const seriesApi = new SeriesApi();
