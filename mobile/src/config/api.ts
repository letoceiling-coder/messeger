/**
 * API Configuration
 * Настройки подключения к backend серверу
 * Используем тот же домен, что и веб — тогда с телефона запросы работают так же.
 */

// Тот же адрес, что и веб-версия (nginx проксирует /api и /socket.io)
export const API_BASE_URL = 'https://neekloai.ru/api';
export const WS_BASE_URL = 'https://neekloai.ru';
// Базовый URL для медиа (фото, видео, аудио) — /uploads раздаётся nginx
export const MEDIA_BASE_URL = 'https://neekloai.ru';

// Для локальной разработки:
// Android эмулятор: 'http://10.0.2.2:3001'
// iOS симулятор: 'http://localhost:3001'
// Реальное устройство: 'http://192.168.X.X:3001' (локальный IP компьютера)

export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ME: '/auth/me',
  
  // Users
  USERS: '/users',
  USERS_SEARCH: '/users/search',
  USER_AVATAR: '/users/me/avatar',
  
  // Chats
  CHATS: '/chats',
  DIRECT_CHAT: '/chats/direct',
  GROUP_CHAT: '/chats/group',
  
  // Messages
  MESSAGES: '/messages',
  UPLOAD_AUDIO: '/messages/upload-audio',
  UPLOAD_MEDIA: '/messages/upload-media',
  UPLOAD_DOCUMENT: '/messages/upload-document',
  
  // Search
  SEARCH_CHATS: '/messages/search-chats',
  SEARCH_IN_CHAT: '/messages/search-in-chat',
  SEARCH_GLOBAL: '/messages/search-global',
};

export const TIMEOUTS = {
  REQUEST: 30000, // 30 seconds
  UPLOAD: 120000, // 2 minutes for file uploads
};
