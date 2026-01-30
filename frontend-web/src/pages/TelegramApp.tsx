import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { useWebSocket } from '../contexts/WebSocketContext';

// Типы для Telegram WebApp API
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: any;
        ready: () => void;
        expand: () => void;
        sendData: (data: string) => void;
        onEvent: (event: string, callback: () => void) => void;
        offEvent: (event: string, callback: () => void) => void;
      };
    };
  }
}

export const TelegramApp = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { socket } = useWebSocket();

  useEffect(() => {
    const authenticateWithTelegram = async () => {
      try {
        // Проверка наличия Telegram WebApp API
        if (!window.Telegram?.WebApp) {
          setError('Telegram WebApp API не доступен');
          setLoading(false);
          return;
        }

        const telegramWebApp = window.Telegram.WebApp;
        telegramWebApp.ready();
        telegramWebApp.expand();

        // Получить initData
        const initData = telegramWebApp.initData;
        if (!initData) {
          setError('initData не получен от Telegram');
          setLoading(false);
          return;
        }

        // Аутентификация через Backend
        const response = await api.post<{ accessToken: string; user: any }>('/auth/telegram', {
          initData,
        });

        const { accessToken, user } = response.data;

        // Сохранение токена и пользователя
        login(user, accessToken);

        // Подключение к WebSocket
        socket.connect(accessToken);

        // Перенаправление на главную страницу
        navigate('/');
      } catch (err: any) {
        console.error('Ошибка аутентификации через Telegram:', err);
        setError(err.response?.data?.message || 'Ошибка аутентификации');
      } finally {
        setLoading(false);
      }
    };

    authenticateWithTelegram();
  }, [navigate, login, socket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="text-gray-500 mb-2">Подключение к Telegram...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center max-w-md px-4">
          <div className="text-red-600 mb-4 text-lg font-semibold">Ошибка</div>
          <div className="text-gray-700 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return null; // Компонент перенаправляет, поэтому ничего не рендерит
};
