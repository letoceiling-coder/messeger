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

  async updateMessage(messageId: string, content: string): Promise<Message> {
    const response = await api.patch<Message>(`/messages/${messageId}`, { content });
    return response.data;
  },

  /** Поиск сообщений в конкретном чате */
  async searchInChat(chatId: string, query: string): Promise<Message[]> {
    if (!query.trim()) return [];
    const response = await api.get<Message[]>(`/messages/search/chat/${chatId}`, {
      params: { q: query.trim() },
    });
    return response.data;
  },

  /** Глобальный поиск по всем чатам */
  async searchGlobal(query: string): Promise<Message[]> {
    if (!query.trim()) return [];
    const response = await api.get<Message[]>('/messages/search/global', {
      params: { q: query.trim() },
    });
    return response.data;
  },

  /** Добавить/удалить реакцию на сообщение */
  async toggleReaction(messageId: string, emoji: string): Promise<{ action: 'added' | 'removed'; emoji: string }> {
    const response = await api.post<{ action: 'added' | 'removed'; emoji: string }>(`/messages/${messageId}/reactions`, { emoji });
    return response.data;
  },

  /** Получить реакции для сообщения */
  async getReactions(messageId: string): Promise<any[]> {
    const response = await api.get<any[]>(`/messages/${messageId}/reactions`);
    return response.data;
  },

  /** Загрузить документ */
  async uploadDocument(chatId: string, file: File, caption?: string): Promise<{ message: Message; documentUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    if (caption) {
      formData.append('caption', caption);
    }

    const response = await api.post<{ message: Message; documentUrl: string }>('/messages/upload-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
