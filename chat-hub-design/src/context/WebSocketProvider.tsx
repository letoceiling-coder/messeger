import React, { useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessagesContext';
import { getSocket, disconnectSocket, type MessageReceivedPayload } from '@/services/websocket';
import { WebSocketContext } from './websocket-context';
import type { Message } from '@/types/messenger';

function parseVoiceDuration(content: string): number | undefined {
  const m = /\((\d+)с\)/.exec(content);
  return m ? parseInt(m[1], 10) : undefined;
}

function payloadToMessage(p: MessageReceivedPayload, currentUserId: string): Message {
  const ts = typeof p.createdAt === 'string' ? new Date(p.createdAt) : new Date();
  const type = (p.messageType as Message['type']) || 'text';
  const mediaUrl = p.mediaUrl ?? (type === 'voice' ? p.audioUrl : null) ?? undefined;
  const msg: Message = {
    id: p.id,
    chatId: p.chatId,
    senderId: p.userId,
    type,
    content: p.content ?? '',
    timestamp: ts,
    status: 'sent',
    isOutgoing: p.userId === currentUserId,
    replyTo: p.replyToId ?? undefined,
    mediaUrl: mediaUrl ?? undefined,
  };
  if (type === 'voice') msg.duration = parseVoiceDuration(p.content ?? '');
  return msg;
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { addMessageToChat, setMessagesForChat } = useMessages();
  const currentUserId = user?.id ?? '';

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
      setMessagesForChat(data.chatId, (prev) => {
        if (!prev.some((m) => m.id === data.messageId)) return prev;
        return prev.filter((m) => m.id !== data.messageId);
      });
    };

    const onEdited = (data: { id: string; chatId?: string; content: string; isEdited: boolean; updatedAt: string }) => {
      const chatId = data.chatId;
      if (!chatId) return;
      setMessagesForChat(chatId, (prev) => {
        const idx = prev.findIndex((m) => m.id === data.id);
        if (idx < 0) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], content: data.content, editedAt: new Date(data.updatedAt) };
        return next;
      });
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

  const value = { emitTypingStart, emitTypingStop };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
