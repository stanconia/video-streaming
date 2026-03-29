import axios, { AxiosInstance } from 'axios';
import { BankAccountStatus, SetupBankAccountRequest } from '../../../types/payment/payment.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class StripeConnectApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async setupBankAccount(request: SetupBankAccountRequest): Promise<BankAccountStatus> {
    const response = await this.client.post<BankAccountStatus>(
      '/stripe-connect/setup-bank-account', request);
    return response.data;
  }

  async getStatus(): Promise<BankAccountStatus> {
    const response = await this.client.get<BankAccountStatus>('/stripe-connect/status');
    return response.data;
  }

  async initiateBackgroundCheck(): Promise<{ status: string }> {
    const response = await this.client.post<{ status: string }>('/stripe-connect/background-check');
    return response.data;
  }

  async getBackgroundCheckStatus(): Promise<{ status: string }> {
    const response = await this.client.get<{ status: string }>('/stripe-connect/background-check');
    return response.data;
  }
}

export const stripeConnectApi = new StripeConnectApi();
