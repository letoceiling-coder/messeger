import React, { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useChats } from '@/context/ChatsContext';
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
  const location = useLocation();
  const currentChatId = /^\/chat\/([^/]+)/.exec(location.pathname)?.[1] ?? null;
  const { user } = useAuth();
  const { onNewMessage, updateChat } = useChats();
  const { addMessageToChat, setMessagesForChat, setMessageStatus, applyReactionFromWs } = useMessages();
  const currentUserId = user?.id ?? '';

  const emitTypingStart = useCallback((chatId: string) => {
    const s = getSocket(localStorage.getItem('accessToken'));
    if (s?.connected) s.emit('typing:start', { chatId });
  }, []);

  const emitTypingStop = useCallback((chatId: string) => {
    const s = getSocket(localStorage.getItem('accessToken'));
    if (s?.connected) s.emit('typing:stop', { chatId });
  }, []);

  const emitMessageDelivered = useCallback((messageId: string) => {
    const s = getSocket(localStorage.getItem('accessToken'));
    if (s?.connected) s.emit('message:delivered', { messageId });
  }, []);

  const emitMessageRead = useCallback((messageId: string) => {
    const s = getSocket(localStorage.getItem('accessToken'));
    if (s?.connected) s.emit('message:read', { messageId });
  }, []);

  const emitChatJoin = useCallback((chatId: string) => {
    const s = getSocket(localStorage.getItem('accessToken'));
    if (s?.connected) s.emit('chat:join', { chatId });
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
      const isViewingThisChat = currentChatId === p.chatId;
      onNewMessage(p.chatId, msg, msg.isOutgoing, !isViewingThisChat);
      if (!msg.isOutgoing) {
        emitMessageDelivered(p.id);
      }
    };

    const onDeliveryStatus = (data: { messageId: string; chatId: string; status: 'delivered' | 'read' }) => {
      if (data.chatId && data.messageId && data.status) {
        setMessageStatus(data.chatId, data.messageId, data.status);
      }
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

    const typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
    const onTypingStart = (data: { chatId: string; userId: string }) => {
      if (!data.chatId || data.userId === currentUserId) return;
      updateChat(data.chatId, { isTyping: true });
      if (typingTimeouts.has(data.chatId)) clearTimeout(typingTimeouts.get(data.chatId)!);
      typingTimeouts.set(
        data.chatId,
        setTimeout(() => {
          updateChat(data.chatId, { isTyping: false });
          typingTimeouts.delete(data.chatId);
        }, 5000)
      );
    };
    const onTypingStop = (data: { chatId: string; userId: string }) => {
      if (!data.chatId || data.userId === currentUserId) return;
      if (typingTimeouts.has(data.chatId)) {
        clearTimeout(typingTimeouts.get(data.chatId)!);
        typingTimeouts.delete(data.chatId);
      }
      updateChat(data.chatId, { isTyping: false });
    };

    s.on('message:received', onMessage);
    s.on('message:deleted', (data: { messageId: string; chatId: string }) => onDeleted(data));
    s.on('message:edited', onEdited);
    s.on('message:delivery_status', onDeliveryStatus);
    s.on('typing:start', onTypingStart);
    s.on('typing:stop', onTypingStop);

    const onReactionUpdated = (data: { messageId: string; chatId?: string; emoji: string; action: 'added' | 'removed'; userId: string }) => {
      if (!data.chatId || !data.messageId || !data.emoji || !data.action) return;
      applyReactionFromWs(data.chatId, data.messageId, data.emoji, data.action, data.userId);
    };
    s.on('reaction:updated', onReactionUpdated);

    return () => {
      s.off('message:received', onMessage);
      s.off('message:deleted');
      s.off('message:edited');
      s.off('message:delivery_status', onDeliveryStatus);
      s.off('typing:start', onTypingStart);
      s.off('typing:stop', onTypingStop);
      s.off('reaction:updated', onReactionUpdated);
      typingTimeouts.forEach((t) => clearTimeout(t));
    };
  }, [currentUserId, currentChatId, addMessageToChat, setMessagesForChat, setMessageStatus, emitMessageDelivered, onNewMessage, updateChat, applyReactionFromWs]);

  useEffect(() => {
    return () => disconnectSocket();
  }, []);

  const value = { emitTypingStart, emitTypingStop, emitMessageDelivered, emitMessageRead, emitChatJoin };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
