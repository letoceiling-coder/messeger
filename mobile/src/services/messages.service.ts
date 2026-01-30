import { api } from './api';
import { Message } from '../types';

export const messagesService = {
  async getMessages(chatId: string, limit = 50, offset = 0): Promise<Message[]> {
    const response = await api.get<Message[]>(`/messages?chatId=${chatId}&limit=${limit}&offset=${offset}`);
    return response.data;
  },
};
