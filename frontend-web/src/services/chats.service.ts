import { api } from './api';
import { Chat } from '../types';

export const chatsService = {
  async getChats(): Promise<Chat[]> {
    const response = await api.get<Chat[]>('/chats');
    return response.data;
  },

  async getChat(id: string): Promise<Chat> {
    const response = await api.get<Chat>(`/chats/${id}`);
    return response.data;
  },

  /** Создать или открыть личный чат с пользователем */
  async createDirectChat(userId: string): Promise<Chat> {
    const response = await api.post<Chat>('/chats/direct', { userId });
    return response.data;
  },
};
