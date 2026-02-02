import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Message, MessageReaction } from '@/types/messenger';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { mapApiMessageToMessage, type ApiMessage } from '@/services/messageMapper';
import { MESSAGES_PAGE_SIZE } from '@/constants';

interface MessagesContextValue {
  getMessages: (chatId: string) => Message[];
  getAllMessages: (chatId: string) => Message[];
  setMessagesForChat: (chatId: string, updater: (prev: Message[]) => Message[]) => void;
  addMessageToChat: (chatId: string, message: Message) => void;
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
    setMessagesForChat(chatId, (prev) => [...prev, { ...message, chatId }]);
  }, [setMessagesForChat]);

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
