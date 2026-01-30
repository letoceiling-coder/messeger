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
};
