import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest } from '../../../types/auth/auth.types';

import { API_BASE } from '../config';

export class AuthApi {
  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_BASE}/auth/login`, request);
    return response.data;
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_BASE}/auth/register`, request);
    return response.data;
  }

  async loginWithGoogle(credential: string): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_BASE}/auth/google`, { credential });
    return response.data;
  }

  async handleParentalConsent(token: string, action: string): Promise<{ message: string; consentType: string; status: string }> {
    const response = await axios.get(`${API_BASE}/auth/parental-consent`, {
      params: { token, action },
    });
    return response.data;
  }
}

export const authApi = new AuthApi();
