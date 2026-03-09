import axios, { AxiosInstance } from 'axios';
import { PayoutSummary, TeacherEarning } from '../../../types/payment/payment.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class PayoutApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getSummary(): Promise<PayoutSummary> {
    const response = await this.client.get<PayoutSummary>('/payouts/summary');
    return response.data;
  }

  async getHistory(): Promise<TeacherEarning[]> {
    const response = await this.client.get<TeacherEarning[]>('/payouts/history');
    return response.data;
  }
}

export const payoutApi = new PayoutApi();
