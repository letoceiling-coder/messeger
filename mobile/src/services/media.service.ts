import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '@config/api';

/**
 * Загрузка фото/видео — используем fetch вместо axios для лучшей совместимости с Android FormData
 */
export const mediaService = {
  async uploadImage(uri: string, chatId: string, type = 'image/jpeg', name = 'image.jpg') {
    const token = await AsyncStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', {uri, type, name} as any);
    formData.append('chatId', chatId);

    const res = await fetch(`${API_BASE_URL}/messages/upload-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async uploadVideo(uri: string, chatId: string, type = 'video/mp4', name = 'video.mp4') {
    const token = await AsyncStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', {uri, type, name} as any);
    formData.append('chatId', chatId);

    const res = await fetch(`${API_BASE_URL}/messages/upload-video`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || `HTTP ${res.status}`);
    }
    return res.json();
  },
};
