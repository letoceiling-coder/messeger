import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Message, MessageReaction } from '@/types/messenger';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { uploadService } from '@/services/upload.service';
import { mapApiMessageToMessage, type ApiMessage } from '@/services/messageMapper';
import { MESSAGES_PAGE_SIZE } from '@/constants';
import { toast } from '@/components/ui/sonner';

interface MessagesContextValue {
  getMessages: (chatId: string) => Message[];
  getAllMessages: (chatId: string) => Message[];
  setMessagesForChat: (chatId: string, updater: (prev: Message[]) => Message[]) => void;
  addMessageToChat: (chatId: string, message: Message) => void;
  /** Отправка текста через API */
  sendTextMessage: (chatId: string, content: string, replyToId?: string) => Promise<Message | null>;
  /** Голосовое сообщение */
  sendVoiceMessage: (chatId: string, blob: Blob, durationSec: number) => Promise<Message | null>;
  /** Видеокружок */
  sendVideoNoteMessage: (chatId: string, blob: Blob, durationSec: number) => Promise<Message | null>;
  /** Фото или видео */
  sendMediaMessage: (chatId: string, file: File, caption?: string) => Promise<Message | null>;
  /** Файл/документ */
  sendDocumentMessage: (chatId: string, file: File, caption?: string) => Promise<Message | null>;
  /** Опрос */
  sendPollMessage: (chatId: string, question: string, options: string[]) => Promise<Message | null>;
  /** Геолокация */
  sendLocationMessage: (chatId: string, lat: number, lng: number) => Promise<Message | null>;
  /** Редактирование сообщения через API */
  editMessageContent: (chatId: string, messageId: string, content: string) => Promise<boolean>;
  /** Удаление на сервере и локально (у себя) */
  deleteMessageFromServer: (chatId: string, messageId: string) => Promise<boolean>;
  /** Удаление у всех участников */
  deleteForEveryone: (chatId: string, messageId: string) => Promise<boolean>;
  deleteMessage: (chatId: string, messageId: string) => void;
  updateMessageReaction: (chatId: string, messageId: string, emoji: string, add: boolean) => Promise<void>;
  /** Применить реакцию из WebSocket (reaction:updated) */
  applyReactionFromWs: (chatId: string, messageId: string, emoji: string, action: 'added' | 'removed', userId: string) => void;
  incrementViews: (chatId: string, messageId: string) => void;
  loadMoreMessages: (chatId: string) => void;
  hasMoreOlder: (chatId: string) => boolean;
  /** Загрузить сообщения чата (вызывать при открытии чата) */
  loadMessagesForChat: (chatId: string) => Promise<void>;
  messagesLoading: Record<string, boolean>;
  messagesErrorByChat: Record<string, string | null>;
  hasMoreByChat: Record<string, boolean>;
  setMessageStatus: (chatId: string, messageId: string, status: Message['status']) => void;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const currentUserId = user?.id ?? '';
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});
  const [offsetByChat, setOffsetByChat] = useState<Record<string, number>>({});
  const [hasMoreByChat, setHasMoreByChat] = useState<Record<string, boolean>>({});
  const [messagesLoading, setMessagesLoading] = useState<Record<string, boolean>>({});
  const [messagesErrorByChat, setMessagesErrorByChat] = useState<Record<string, string | null>>({});

  const getFullMessages = useCallback(
    (chatId: string): Message[] => messagesByChat[chatId] ?? [],
    [messagesByChat]
  );

  const getMessages = useCallback(
    (chatId: string): Message[] => getFullMessages(chatId),
    [getFullMessages]
  );

  const loadMessagesForChat = useCallback(
    async (chatId: string, append = false) => {
      if (!currentUserId) return;
      const offset = append ? offsetByChat[chatId] ?? MESSAGES_PAGE_SIZE : 0;
      if (!append) {
        setMessagesLoading((prev) => ({ ...prev, [chatId]: true }));
        setMessagesErrorByChat((prev) => ({ ...prev, [chatId]: null }));
      }
      try {
        const data = await api.get<ApiMessage[]>(
          `/messages?chatId=${encodeURIComponent(chatId)}&limit=${MESSAGES_PAGE_SIZE}&offset=${offset}`
        );
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map((m) => mapApiMessageToMessage(m, currentUserId));
        const ordered = [...mapped].reverse();
        setMessagesByChat((prev) => {
          const existing = prev[chatId] ?? [];
          if (append) {
            const existingIds = new Set(existing.map((e) => e.id));
            const toPrepend = ordered.filter((m) => !existingIds.has(m.id));
            return { ...prev, [chatId]: [...toPrepend, ...existing] };
          }
          return { ...prev, [chatId]: ordered };
        });
        setHasMoreByChat((prev) => ({
          ...prev,
          [chatId]: list.length >= MESSAGES_PAGE_SIZE,
        }));
        if (append) {
          setOffsetByChat((prev) => ({ ...prev, [chatId]: offset + MESSAGES_PAGE_SIZE }));
        } else {
          setOffsetByChat((prev) => ({ ...prev, [chatId]: MESSAGES_PAGE_SIZE }));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Не удалось загрузить сообщения';
        setMessagesErrorByChat((prev) => ({ ...prev, [chatId]: msg }));
      } finally {
        setMessagesLoading((prev) => ({ ...prev, [chatId]: false }));
      }
    },
    [currentUserId, offsetByChat]
  );

  const loadMoreMessages = useCallback(
    (chatId: string) => {
      if (hasMoreByChat[chatId] !== false && !messagesLoading[chatId]) {
        loadMessagesForChat(chatId, true);
      }
    },
    [hasMoreByChat, messagesLoading, loadMessagesForChat]
  );

  const hasMoreOlder = useCallback(
    (chatId: string): boolean => hasMoreByChat[chatId] ?? false,
    [hasMoreByChat]
  );

  const setMessagesForChat = useCallback((chatId: string, updater: (prev: Message[]) => Message[]) => {
    setMessagesByChat((prev) => ({
      ...prev,
      [chatId]: updater(prev[chatId] ?? []),
    }));
  }, []);

  const addMessageToChat = useCallback((chatId: string, message: Message) => {
    setMessagesForChat(chatId, (prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, { ...message, chatId }];
    });
  }, [setMessagesForChat]);

  const sendTextMessage = useCallback(
    async (chatId: string, content: string, replyToId?: string): Promise<Message | null> => {
      if (!currentUserId || !content.trim()) return null;
      try {
        const body: { chatId: string; content: string; replyToId?: string } = { chatId, content: content.trim() };
        if (replyToId) body.replyToId = replyToId;
        const res = await api.post<ApiMessage>('/messages', body);
        const msg = mapApiMessageToMessage(res, currentUserId);
        addMessageToChat(chatId, msg);
        return msg;
      } catch {
        toast.error('Не удалось отправить сообщение');
        return null;
      }
    },
    [currentUserId, addMessageToChat]
  );

  const sendVoiceMessage = useCallback(
    async (chatId: string, blob: Blob, durationSec: number): Promise<Message | null> => {
      if (!currentUserId) return null;
      try {
        const { message } = await uploadService.uploadAudio(blob, chatId, durationSec);
        const msg = mapApiMessageToMessage(
          { ...message, audioUrl: message.audioUrl ?? undefined, messageDeliveries: [{ status: 'sent' }] },
          currentUserId
        );
        msg.duration = durationSec;
        return msg;
      } catch {
        toast.error('Не удалось отправить голосовое сообщение');
        return null;
      }
    },
    [currentUserId]
  );

  const sendVideoNoteMessage = useCallback(
    async (chatId: string, blob: Blob, durationSec: number): Promise<Message | null> => {
      if (!currentUserId) return null;
      try {
        const { message } = await uploadService.uploadVideo(blob, chatId, undefined, true);
        const msg = mapApiMessageToMessage(
          { ...message, messageDeliveries: [{ status: 'sent' }] },
          currentUserId
        );
        msg.type = 'video_note';
        msg.videoNoteDuration = durationSec;
        msg.duration = durationSec;
        return msg;
      } catch {
        toast.error('Не удалось отправить видеокружок');
        return null;
      }
    },
    [currentUserId]
  );

  const sendMediaMessage = useCallback(
    async (chatId: string, file: File, caption?: string): Promise<Message | null> => {
      if (!currentUserId) return null;
      try {
        const isVideo = file.type.startsWith('video/');
        const { message } = isVideo
          ? await uploadService.uploadVideo(file, chatId, caption)
          : await uploadService.uploadImage(file, chatId, caption);
        const msg = mapApiMessageToMessage(
          { ...message, messageDeliveries: [{ status: 'sent' }] },
          currentUserId
        );
        addMessageToChat(chatId, msg);
        return msg;
      } catch {
        toast.error('Не удалось отправить медиа');
        return null;
      }
    },
    [currentUserId, addMessageToChat]
  );

  const sendDocumentMessage = useCallback(
    async (chatId: string, file: File, caption?: string): Promise<Message | null> => {
      if (!currentUserId) return null;
      try {
        const { message } = await uploadService.uploadDocument(file, chatId, caption);
        const msg = mapApiMessageToMessage(
          { ...message, messageDeliveries: [{ status: 'sent' }] },
          currentUserId
        );
        msg.type = 'file';
        addMessageToChat(chatId, msg);
        return msg;
      } catch {
        toast.error('Не удалось отправить файл');
        return null;
      }
    },
    [currentUserId, addMessageToChat]
  );

  const sendPollMessage = useCallback(
    async (chatId: string, question: string, options: string[]): Promise<Message | null> => {
      if (!currentUserId || !question.trim() || options.length < 2) return null;
      const content = JSON.stringify({
        _type: 'poll',
        question: question.trim(),
        options: options.map((text, i) => ({ id: `opt-${i}`, text: text.trim(), votes: 0 })),
      });
      try {
        const res = await api.post<ApiMessage>('/messages', { chatId, content });
        const msg = mapApiMessageToMessage(res, currentUserId);
        msg.type = 'poll';
        addMessageToChat(chatId, msg);
        return msg;
      } catch {
        toast.error('Не удалось отправить опрос');
        return null;
      }
    },
    [currentUserId, addMessageToChat]
  );

  const sendLocationMessage = useCallback(
    async (chatId: string, lat: number, lng: number): Promise<Message | null> => {
      if (!currentUserId) return null;
      const content = JSON.stringify({ _type: 'location', lat, lng });
      try {
        const res = await api.post<ApiMessage>('/messages', { chatId, content });
        const msg = mapApiMessageToMessage(res, currentUserId);
        msg.type = 'location';
        addMessageToChat(chatId, msg);
        return msg;
      } catch {
        toast.error('Не удалось отправить геолокацию');
        return null;
      }
    },
    [currentUserId, addMessageToChat]
  );

  const editMessageContent = useCallback(
    async (chatId: string, messageId: string, content: string): Promise<boolean> => {
      try {
        const res = await api.patch<ApiMessage>(`/messages/${messageId}`, { content: content.trim() });
        setMessagesForChat(chatId, (prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, content: res.content ?? content, editedAt: new Date(res.createdAt ?? Date.now()) }
              : m
          )
        );
        return true;
      } catch {
        toast.error('Не удалось отредактировать сообщение');
        return false;
      }
    },
    [setMessagesForChat]
  );

  const deleteMessageFromServer = useCallback(
    async (chatId: string, messageId: string): Promise<boolean> => {
      try {
        await api.delete(`/messages/${messageId}`);
        setMessagesForChat(chatId, (prev) => prev.filter((m) => m.id !== messageId));
        return true;
      } catch {
        toast.error('Не удалось удалить сообщение');
        return false;
      }
    },
    [setMessagesForChat]
  );

  const deleteForEveryone = useCallback(
    async (chatId: string, messageId: string): Promise<boolean> => {
      try {
        await api.post('/messages/delete-for-everyone', { messageId });
        setMessagesForChat(chatId, (prev) => prev.filter((m) => m.id !== messageId));
        return true;
      } catch {
        toast.error('Не удалось удалить сообщение у всех');
        return false;
      }
    },
    [setMessagesForChat]
  );

  const deleteMessage = useCallback(
    (chatId: string, messageId: string) => {
      setMessagesForChat(chatId, (prev) => prev.filter((m) => m.id !== messageId));
    },
    [setMessagesForChat]
  );

  const applyReactionToMessage = useCallback(
    (
      prev: Message[],
      messageId: string,
      emoji: string,
      action: 'added' | 'removed',
      userId: string
    ): Message[] =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        let reactions: MessageReaction[] = [...(m.reactions ?? [])];
        if (action === 'added') {
          reactions = reactions
            .map((r) => {
              const hadUser = (r.userIds ?? []).includes(userId);
              const nextUserIds = (r.userIds ?? []).filter((id) => id !== userId);
              const nextCount = hadUser ? r.count - 1 : r.count;
              return { ...r, userIds: nextUserIds, count: nextCount };
            })
            .filter((r) => r.count > 0);
          const r = reactions.find((x) => x.emoji === emoji);
          if (!r) {
            reactions = [...reactions, { emoji, count: 1, userIds: [userId] }];
          } else {
            reactions = reactions.map((x) =>
              x.emoji === emoji ? { ...x, count: x.count + 1, userIds: [...(x.userIds ?? []), userId] } : x
            );
          }
        } else {
          const r = reactions.find((x) => x.emoji === emoji);
          if (!r || !(r.userIds ?? []).includes(userId)) return m;
          const nextUserIds = (r.userIds ?? []).filter((id) => id !== userId);
          const nextCount = r.count - 1;
          if (nextCount <= 0) {
            reactions = reactions.filter((x) => x.emoji !== emoji);
          } else {
            reactions = reactions.map((x) =>
              x.emoji === emoji ? { ...x, count: nextCount, userIds: nextUserIds } : x
            );
          }
        }
        return { ...m, reactions };
      }),
    []
  );

  const applyReactionFromWs = useCallback(
    (chatId: string, messageId: string, emoji: string, action: 'added' | 'removed', userId: string) => {
      setMessagesForChat(chatId, (prev) => applyReactionToMessage(prev, messageId, emoji, action, userId));
    },
    [setMessagesForChat, applyReactionToMessage]
  );

  const updateMessageReaction = useCallback(
    async (chatId: string, messageId: string, emoji: string, add: boolean) => {
      setMessagesForChat(chatId, (prev) =>
        applyReactionToMessage(prev, messageId, emoji, add ? 'added' : 'removed', currentUserId)
      );
      try {
        await api.post<{ action: string }>(`/messages/${messageId}/reactions`, { emoji });
      } catch {
        setMessagesForChat(chatId, (prev) =>
          applyReactionToMessage(prev, messageId, emoji, add ? 'removed' : 'added', currentUserId)
        );
        toast.error('Не удалось обновить реакцию');
      }
    },
    [setMessagesForChat, applyReactionToMessage, currentUserId]
  );

  const incrementViews = useCallback(
    (chatId: string, messageId: string) => {
      setMessagesForChat(chatId, (prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, views: (m.views ?? 0) + 1 } : m
        )
      );
    },
    [setMessagesForChat]
  );

  const setMessageStatus = useCallback(
    (chatId: string, messageId: string, status: Message['status']) => {
      setMessagesForChat(chatId, (prev) => {
        const idx = prev.findIndex((m) => m.id === messageId);
        if (idx < 0) return prev;
        if (prev[idx].status === status) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], status };
        return next;
      });
    },
    [setMessagesForChat]
  );

  const value: MessagesContextValue = {
    getMessages,
    getAllMessages: getFullMessages,
    setMessagesForChat,
    addMessageToChat,
    sendTextMessage,
    sendVoiceMessage,
    sendVideoNoteMessage,
    sendMediaMessage,
    sendDocumentMessage,
    sendPollMessage,
    sendLocationMessage,
    editMessageContent,
    deleteMessageFromServer,
    deleteForEveryone,
    deleteMessage,
    updateMessageReaction,
    applyReactionFromWs,
    incrementViews,
    loadMoreMessages,
    hasMoreOlder,
    loadMessagesForChat,
    messagesLoading,
    messagesErrorByChat,
    hasMoreByChat,
    setMessageStatus,
  };

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
}
