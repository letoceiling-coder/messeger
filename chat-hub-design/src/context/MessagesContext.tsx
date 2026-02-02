import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Message, MessageReaction } from '@/types/messenger';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { uploadService } from '@/services/upload.service';
import { mapApiMessageToMessage, type ApiMessage } from '@/services/messageMapper';
import { MESSAGES_PAGE_SIZE } from '@/constants';

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
  /** Редактирование сообщения через API */
  editMessageContent: (chatId: string, messageId: string, content: string) => Promise<boolean>;
  /** Удаление на сервере и локально (у себя) */
  deleteMessageFromServer: (chatId: string, messageId: string) => Promise<boolean>;
  /** Удаление у всех участников */
  deleteForEveryone: (chatId: string, messageId: string) => Promise<boolean>;
  deleteMessage: (chatId: string, messageId: string) => void;
  updateMessageReaction: (chatId: string, messageId: string, emoji: string, add: boolean) => void;
  incrementViews: (chatId: string, messageId: string) => void;
  loadMoreMessages: (chatId: string) => void;
  hasMoreOlder: (chatId: string) => boolean;
  /** Загрузить сообщения чата (вызывать при открытии чата) */
  loadMessagesForChat: (chatId: string) => Promise<void>;
  messagesLoading: Record<string, boolean>;
  hasMoreByChat: Record<string, boolean>;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const currentUserId = user?.id ?? '';
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});
  const [offsetByChat, setOffsetByChat] = useState<Record<string, number>>({});
  const [hasMoreByChat, setHasMoreByChat] = useState<Record<string, boolean>>({});
  const [messagesLoading, setMessagesLoading] = useState<Record<string, boolean>>({});

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
      if (!append) setMessagesLoading((prev) => ({ ...prev, [chatId]: true }));
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

  const updateMessageReaction = useCallback(
    (chatId: string, messageId: string, emoji: string, add: boolean) => {
      setMessagesForChat(chatId, (prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          let reactions: MessageReaction[] = [...(m.reactions ?? [])];
          if (add) {
            reactions = reactions
              .map((r) => {
                const hadUser = (r.userIds ?? []).includes(currentUserId);
                const nextUserIds = (r.userIds ?? []).filter((id) => id !== currentUserId);
                const nextCount = hadUser ? r.count - 1 : r.count;
                return { ...r, userIds: nextUserIds, count: nextCount };
              })
              .filter((r) => r.count > 0);
            const r = reactions.find((x) => x.emoji === emoji);
            if (!r) {
              reactions = [...reactions, { emoji, count: 1, userIds: [currentUserId] }];
            } else {
              reactions = reactions.map((x) =>
                x.emoji === emoji
                  ? { ...x, count: x.count + 1, userIds: [...(x.userIds ?? []), currentUserId] }
                  : x
              );
            }
          } else {
            const r = reactions.find((x) => x.emoji === emoji);
            if (!r || !(r.userIds ?? []).includes(currentUserId)) return m;
            const nextUserIds = (r.userIds ?? []).filter((id) => id !== currentUserId);
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
        })
      );
    },
    [setMessagesForChat, currentUserId]
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
    editMessageContent,
    deleteMessageFromServer,
    deleteForEveryone,
    deleteMessage,
    updateMessageReaction,
    incrementViews,
    loadMoreMessages,
    hasMoreOlder,
    loadMessagesForChat,
    messagesLoading,
    hasMoreByChat,
  };

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
}
