import axios, { AxiosInstance } from 'axios';
import { Coupon, CreateCouponRequest } from '../../../types/payment/coupon.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class CouponApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async createCoupon(request: CreateCouponRequest): Promise<Coupon> {
    const response = await this.client.post<Coupon>('/coupons', request);
    return response.data;
  }

  async getMyCoupons(): Promise<Coupon[]> {
    const response = await this.client.get<Coupon[]>('/coupons/my');
    return response.data;
  }

  async validateCoupon(code: string, classId: string): Promise<Coupon> {
    const response = await this.client.get<Coupon>('/coupons/validate', { params: { code, classId } });
    return response.data;
  }

  async applyCoupon(code: string, bookingId: string): Promise<any> {
    const response = await this.client.post('/coupons/apply', { code, bookingId });
    return response.data;
  }
}

export const couponApi = new CouponApi();
