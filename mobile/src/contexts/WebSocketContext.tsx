import React, {createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback} from 'react';
import {io, Socket} from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {WS_BASE_URL} from '@config/api';
import {useAuth} from './AuthContext';
import {Message} from '@types/index';

export interface IncomingCall {
  chatId: string;
  callerId: string;
  offer: RTCSessionDescriptionInit;
  videoMode?: boolean;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (data: any) => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  onMessage: (callback: (message: Message) => void) => () => void;
  onTypingStart: (callback: (data: {chatId: string; userId: string}) => void) => () => void;
  onTypingStop: (callback: (data: {chatId: string; userId: string}) => void) => () => void;
  globalIncomingCall: IncomingCall | null;
  rejectGlobalCall: () => void;
  clearGlobalCall: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({children}: {children: ReactNode}) => {
  const {isAuthenticated} = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [globalIncomingCall, setGlobalIncomingCall] = useState<IncomingCall | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      initializeSocket();
    } else {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setGlobalIncomingCall(null);
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated]);

  const initializeSocket = async () => {
    try {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);

      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      const newSocket = io(WS_BASE_URL, {
        auth: {token},
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      newSocket.on('connect', () => {
        console.log('WebSocket подключён');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('WebSocket отключён');
        setIsConnected(false);
      });

      newSocket.on('error', (error: any) => {
        console.error('WebSocket ошибка:', error);
      });

      newSocket.on('call:offer', (data: IncomingCall) => {
        setGlobalIncomingCall(data);
      });

      newSocket.on('call:end', (data: {chatId: string}) => {
        setGlobalIncomingCall(prev => (prev?.chatId === data.chatId ? null : prev));
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    } catch (error) {
      console.error('Ошибка инициализации WebSocket:', error);
    }
  };

  const rejectGlobalCall = useCallback(() => {
    if (globalIncomingCall && socket) {
      socket.emit('call:reject', {chatId: globalIncomingCall.chatId});
      setGlobalIncomingCall(null);
    }
  }, [globalIncomingCall, socket]);

  const clearGlobalCall = useCallback(() => {
    setGlobalIncomingCall(null);
  }, []);

  const sendMessage = useCallback((data: any) => {
    if (socket && isConnected) {
      socket.emit('message:send', data);
    }
  }, [socket, isConnected]);

  const joinChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('chat:join', {chatId});
    }
  }, [socket, isConnected]);

  const leaveChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('chat:leave', {chatId});
    }
  }, [socket, isConnected]);

  const onMessage = useCallback((callback: (message: Message) => void) => {
    if (!socket) return () => {};

    socket.on('message:received', callback);
    return () => {
      socket.off('message:received', callback);
    };
  }, [socket]);

  const onTypingStart = useCallback((callback: (data: {chatId: string; userId: string}) => void) => {
    if (!socket) return () => {};

    socket.on('typing:start', callback);
    return () => {
      socket.off('typing:start', callback);
    };
  }, [socket]);

  const onTypingStop = useCallback((callback: (data: {chatId: string; userId: string}) => void) => {
    if (!socket) return () => {};

    socket.on('typing:stop', callback);
    return () => {
      socket.off('typing:stop', callback);
    };
  }, [socket]);

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        sendMessage,
        joinChat,
        leaveChat,
        onMessage,
        onTypingStart,
        onTypingStop,
        globalIncomingCall,
        rejectGlobalCall,
        clearGlobalCall,
      }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket должен использоваться внутри WebSocketProvider');
  }
  return context;
};
