import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { websocketService, ConnectionStatus } from '../services/websocket.service';
import { useAuth } from './AuthContext';

/** Реальное время: userId -> true (онлайн) / false (оффлайн). Если ключа нет — использовать данные с API. */
export type OnlineStatusMap = Record<string, boolean>;

export interface IncomingCall {
  chatId: string;
  callerId: string;
  offer: RTCSessionDescriptionInit;
  videoMode?: boolean;
}

interface WebSocketContextType {
  socket: typeof websocketService;
  /** Статусы «в сети» по userId (обновляются по событиям user:online / user:offline) */
  onlineStatus: OnlineStatusMap;
  /** Онлайн ли пользователь: приоритет у real-time, иначе fallback с API */
  isUserOnline: (userId: string | undefined, fallbackFromApi?: boolean) => boolean;
  /** Статус соединения: connected / disconnected / reconnecting */
  connectionStatus: ConnectionStatus;
  /** Глобальный входящий звонок (доступен на любой странице) */
  globalIncomingCall: IncomingCall | null;
  /** Отклонить глобальный входящий звонок */
  rejectGlobalCall: () => void;
  /** Очистить глобальный входящий звонок после принятия */
  clearGlobalCall: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatusMap>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [globalIncomingCall, setGlobalIncomingCall] = useState<IncomingCall | null>(null);

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

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = websocketService.onStatusChange(setConnectionStatus);
    return unsub;
  }, [isAuthenticated]);

  // Глобальная обработка входящих звонков
  useEffect(() => {
    if (!isAuthenticated || connectionStatus !== 'connected') return;

    const handleCallOffer = (data: IncomingCall) => {
      setGlobalIncomingCall(data);
      // Воспроизведение рингтона (если нужно)
      // soundService.playRingtone();
    };

    const handleCallEnd = (data: { chatId: string }) => {
      setGlobalIncomingCall((prev) => (prev?.chatId === data.chatId ? null : prev));
      // soundService.stopRingtone();
    };

    websocketService.on('call:offer', handleCallOffer);
    websocketService.on('call:end', handleCallEnd);

    return () => {
      websocketService.off('call:offer', handleCallOffer);
      websocketService.off('call:end', handleCallEnd);
    };
  }, [isAuthenticated, connectionStatus]);

  const rejectGlobalCall = useCallback(() => {
    if (globalIncomingCall) {
      websocketService.emit('call:reject', { chatId: globalIncomingCall.chatId });
      setGlobalIncomingCall(null);
      // soundService.stopRingtone();
    }
  }, [globalIncomingCall]);

  const clearGlobalCall = useCallback(() => {
    setGlobalIncomingCall(null);
    // soundService.stopRingtone();
  }, []);

  const isUserOnline = useCallback(
    (userId: string | undefined, fallbackFromApi?: boolean): boolean => {
      if (!userId) return false;
      if (userId in onlineStatus) return onlineStatus[userId];
      return fallbackFromApi ?? false;
    },
    [onlineStatus],
  );

  return (
    <WebSocketContext.Provider
      value={{
        socket: websocketService,
        onlineStatus,
        isUserOnline,
        connectionStatus,
        globalIncomingCall,
        rejectGlobalCall,
        clearGlobalCall,
      }}
    >
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
