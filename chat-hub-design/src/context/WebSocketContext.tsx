import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessagesContext';
import { getSocket, disconnectSocket, type MessageReceivedPayload } from '@/services/websocket';
import type { Message } from '@/types/messenger';

interface WebSocketContextValue {
  emitTypingStart: (chatId: string) => void;
  emitTypingStop: (chatId: string) => void;
}

const NOOP_WS: WebSocketContextValue = { emitTypingStart: () => {}, emitTypingStop: () => {} };
const WebSocketContext = createContext<WebSocketContextValue>(NOOP_WS);

function payloadToMessage(p: MessageReceivedPayload, currentUserId: string): Message {
  const ts = typeof p.createdAt === 'string' ? new Date(p.createdAt) : new Date();
  return {
    id: p.id,
    chatId: p.chatId,
    senderId: p.userId,
    type: (p.messageType as Message['type']) || 'text',
    content: p.content ?? '',
    timestamp: ts,
    status: 'sent',
    isOutgoing: p.userId === currentUserId,
    replyTo: p.replyToId ?? undefined,
    mediaUrl: p.mediaUrl ?? undefined,
  };
}

/** Подключает WebSocket, подписывается на message:received и обновляет MessagesContext */
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { addMessageToChat, setMessagesForChat } = useMessages();
  const currentUserId = user?.id ?? '';
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const emitTypingStart = useCallback((chatId: string) => {
    const s = getSocket(localStorage.getItem('accessToken'));
    if (s?.connected) s.emit('typing:start', { chatId });
  }, []);

  const emitTypingStop = useCallback((chatId: string) => {
    const s = getSocket(localStorage.getItem('accessToken'));
    if (s?.connected) s.emit('typing:stop', { chatId });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !currentUserId) {
      disconnectSocket();
      return;
    }

    const s = getSocket(token);
    if (!s) return;

    const onMessage = (p: MessageReceivedPayload) => {
      const msg = payloadToMessage(p, currentUserId);
      addMessageToChat(p.chatId, msg);
    };

    const onDeleted = (data: { messageId: string; chatId: string }) => {
      setMessagesForChat(data.chatId, (prev) =>
        prev.filter((m) => m.id !== data.messageId)
      );
    };

    const onEdited = (data: { id: string; chatId?: string; content: string; isEdited: boolean; updatedAt: string }) => {
      const chatId = data.chatId;
      if (!chatId) return;
      setMessagesForChat(chatId, (prev) =>
        prev.map((m) =>
          m.id === data.id
            ? { ...m, content: data.content, editedAt: new Date(data.updatedAt) }
            : m
        )
      );
    };

    s.on('message:received', onMessage);
    s.on('message:deleted', (data: { messageId: string; chatId: string }) => onDeleted(data));
    s.on('message:edited', onEdited);

    return () => {
      s.off('message:received', onMessage);
      s.off('message:deleted');
      s.off('message:edited');
    };
  }, [currentUserId, addMessageToChat, setMessagesForChat]);

  useEffect(() => {
    return () => disconnectSocket();
  }, []);

  const value: WebSocketContextValue = { emitTypingStart, emitTypingStop };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextValue {
  return useContext(WebSocketContext) ?? NOOP_WS;
}
