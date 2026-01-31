import axios from 'axios';

// В production — всегда относительный /api (чтобы HTTPS-страница не ходила на HTTP). Локально — localhost.
const raw = import.meta.env.VITE_API_URL;
const API_URL = import.meta.env.DEV
  ? (raw || 'http://localhost:3000')
  : (raw && String(raw).startsWith('https') ? raw : '/api');

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавление токена в запросы
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('auth/login');
      const hadToken = !!error.config?.headers?.Authorization;
      // Сбрасываем сессию только если запрос был с токеном (пользователь считался авторизованным)
      if (!isLoginRequest && hadToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
