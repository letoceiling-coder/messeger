import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { websocketService } from '../services/websocket.service';
import { useAuth } from './AuthContext';

/** Реальное время: userId -> true (онлайн) / false (оффлайн). Если ключа нет — использовать данные с API. */
export type OnlineStatusMap = Record<string, boolean>;

interface WebSocketContextType {
  socket: typeof websocketService;
  /** Статусы «в сети» по userId (обновляются по событиям user:online / user:offline) */
  onlineStatus: OnlineStatusMap;
  /** Онлайн ли пользователь: приоритет у real-time, иначе fallback с API */
  isUserOnline: (userId: string | undefined, fallbackFromApi?: boolean) => boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatusMap>({});

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        websocketService.connect(token);
      }
    } else {
      websocketService.disconnect();
      setOnlineStatus({});
    }

    return () => {
      websocketService.disconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleOnline = (data: { userId: string }) => {
      setOnlineStatus((prev) => ({ ...prev, [data.userId]: true }));
    };
    const handleOffline = (data: { userId: string }) => {
      setOnlineStatus((prev) => ({ ...prev, [data.userId]: false }));
    };

    websocketService.onUserOnline(handleOnline);
    websocketService.onUserOffline(handleOffline);

    return () => {
      websocketService.offUserOnline(handleOnline);
      websocketService.offUserOffline(handleOffline);
    };
  }, [isAuthenticated]);

  const isUserOnline = useCallback(
    (userId: string | undefined, fallbackFromApi?: boolean): boolean => {
      if (!userId) return false;
      if (userId in onlineStatus) return onlineStatus[userId];
      return fallbackFromApi ?? false;
    },
    [onlineStatus],
  );

  return (
    <WebSocketContext.Provider value={{ socket: websocketService, onlineStatus, isUserOnline, connectionStatus }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
