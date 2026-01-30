import { api } from './api';
import { AuthResponse, LoginDto } from '../types';

export const authService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', dto);
    return response.data;
  },

  async register(dto: { email: string; username: string; password: string }): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', dto);
    return response.data;
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },
};
