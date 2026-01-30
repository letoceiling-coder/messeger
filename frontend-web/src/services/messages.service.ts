import { api } from './api';
import { Message } from '../types';

export const messagesService = {
  async getMessages(chatId: string, limit = 50, offset = 0): Promise<Message[]> {
    const response = await api.get<Message[]>(`/messages?chatId=${chatId}&limit=${limit}&offset=${offset}`);
    return response.data;
  },

  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/messages/${messageId}`);
  },

  async deleteMessages(messageIds: string[]): Promise<{ deleted: number }> {
    const response = await api.post<{ deleted: number }>('/messages/delete-many', { messageIds });
    return response.data;
  },

  async deleteForEveryone(messageId: string): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>('/messages/delete-for-everyone', {
      messageId,
    });
    return response.data;
  },

  async forwardMessage(
    messageId: string,
    targetChatId: string,
  ): Promise<{ success: boolean; message?: Message }> {
    const response = await api.post<{ success: boolean; message?: Message }>('/messages/forward', {
      messageId,
      targetChatId,
    });
    return response.data;
  },
};
