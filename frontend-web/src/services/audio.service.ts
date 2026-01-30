import { api } from './api';

export const audioService = {
  async uploadAudio(file: File, chatId: string, duration?: number): Promise<{ message: any; audioUrl: string }> {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('chatId', chatId);
    if (duration) {
      formData.append('duration', duration.toString());
    }

    const response = await api.post('/messages/upload-audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
