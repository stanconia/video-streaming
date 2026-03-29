import axios, { AxiosInstance } from 'axios';
import { Booking } from '../../../types/class/class.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class BookingApi {
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

  async bookClass(classId: string, paymentIntentId?: string): Promise<Booking> {
    const response = await this.client.post<Booking>('/bookings', { classId, paymentIntentId });
    return response.data;
  }

  async getMyBookings(): Promise<Booking[]> {
    const response = await this.client.get<Booking[]>('/bookings');
    return response.data;
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    const response = await this.client.delete<Booking>(`/bookings/${bookingId}`);
    return response.data;
  }
}

export const bookingApi = new BookingApi();
