import { api } from './api';

export const audioService = {
  async uploadAudio(uri: string, chatId: string, duration?: number): Promise<{ message: any; audioUrl: string }> {
    const formData = new FormData();
    
    // @ts-ignore
    formData.append('audio', {
      uri,
      type: 'audio/m4a',
      name: 'voice.m4a',
    } as any);
    
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
