import axios, { AxiosInstance } from 'axios';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class PaymentApi {
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

  async createPaymentIntent(classId: string, amount: number, currency: string = 'USD'): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const response = await this.client.post<{ clientSecret: string; paymentIntentId: string }>('/payments/create-intent', {
      classId,
      amount,
      currency,
    });
    return response.data;
  }

  async getStripeConfig(): Promise<{ publishableKey: string }> {
    const response = await this.client.get<{ publishableKey: string }>('/payments/config');
    return response.data;
  }
}

export const paymentApi = new PaymentApi();
