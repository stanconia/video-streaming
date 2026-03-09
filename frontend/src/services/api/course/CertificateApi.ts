import axios, { AxiosInstance } from 'axios';
import { Certificate } from '../../../types/course/certificate.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class CertificateApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getMyCertificates(): Promise<Certificate[]> {
    const response = await this.client.get<Certificate[]>('/certificates');
    return response.data;
  }

  async getCertificate(id: string): Promise<Certificate> {
    const response = await this.client.get<Certificate>(`/certificates/${id}`);
    return response.data;
  }
}

export const certificateApi = new CertificateApi();
