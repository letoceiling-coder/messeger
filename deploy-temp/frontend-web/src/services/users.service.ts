import { api } from './api';
import { User } from '../types';

export const usersService = {
  async searchUsers(query: string): Promise<User[]> {
    if (!query.trim()) return [];
    const response = await api.get<User[]>('/users/search', {
      params: { q: query.trim() },
    });
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  /** Получить список всех пользователей */
  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data;
  },
};
