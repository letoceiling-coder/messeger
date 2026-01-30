import { createContext, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { websocketService } from '../services/websocket.service';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  socket: typeof websocketService;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      connectWebSocket();
    } else {
      websocketService.disconnect();
    }

    return () => {
      websocketService.disconnect();
    };
  }, [isAuthenticated]);

  const connectWebSocket = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        websocketService.connect(token);
      }
    } catch (error) {
      console.error('Ошибка подключения WebSocket:', error);
    }
  };

  return (
    <WebSocketContext.Provider value={{ socket: websocketService }}>
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
