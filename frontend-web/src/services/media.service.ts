import { api } from './api';

export const mediaService = {
  async uploadImage(
    file: File,
    chatId: string,
    caption?: string,
  ): Promise<{ message: { id: string; chatId: string; userId: string; content: string; messageType: string; mediaUrl: string | null; createdAt: string }; mediaUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    if (caption?.trim()) {
      formData.append('caption', caption.trim());
    }
    const response = await api.post('/messages/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async uploadVideo(
    file: File,
    chatId: string,
    caption?: string,
  ): Promise<{ message: { id: string; chatId: string; userId: string; content: string; messageType: string; mediaUrl: string | null; createdAt: string }; mediaUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    if (caption?.trim()) {
      formData.append('caption', caption.trim());
    }
    const response = await api.post('/messages/upload-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
