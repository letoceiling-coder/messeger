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

  /** Создать групповой чат */
  async createGroupChat(name: string, memberIds: string[], description?: string): Promise<Chat> {
    const response = await api.post<Chat>('/chats/group', { name, memberIds, description });
    return response.data;
  },

  /** Обновить групповой чат */
  async updateGroupChat(chatId: string, name?: string, description?: string): Promise<Chat> {
    const response = await api.patch<Chat>(`/chats/${chatId}/group`, { name, description });
    return response.data;
  },

  /** Добавить участника в группу */
  async addMember(chatId: string, userId: string): Promise<Chat> {
    const response = await api.post<Chat>(`/chats/${chatId}/members`, { userId });
    return response.data;
  },

  /** Удалить участника из группы */
  async removeMember(chatId: string, userId: string): Promise<Chat> {
    const response = await api.delete<Chat>(`/chats/${chatId}/members/${userId}`);
    return response.data;
  },

  /** Покинуть группу */
  async leaveGroup(chatId: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/chats/${chatId}/leave`);
    return response.data;
  },

  /** Изменить роль участника */
  async updateMemberRole(chatId: string, userId: string, role: 'admin' | 'member'): Promise<Chat> {
    const response = await api.patch<Chat>(`/chats/${chatId}/members/${userId}/role`, { role });
    return response.data;
  },

  /** Закрепить сообщение */
  async pinMessage(chatId: string, messageId: string): Promise<Chat> {
    const response = await api.post<Chat>(`/chats/${chatId}/pin/${messageId}`);
    return response.data;
  },

  /** Открепить сообщение */
  async unpinMessage(chatId: string): Promise<void> {
    await api.delete(`/chats/${chatId}/pin`);
  },
};
