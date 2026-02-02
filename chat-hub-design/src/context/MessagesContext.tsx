import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Message, MessageReaction } from '@/types/messenger';
import { getMessagesForChat } from '@/data/mockData';
import { MESSAGES_PAGE_SIZE } from '@/constants';

const CURRENT_USER_ID = 'user-1';

interface MessagesContextValue {
  /** Последние N сообщений чата (N = MESSAGES_PAGE_SIZE + подгрузки при скролле вверх) */
  getMessages: (chatId: string) => Message[];
  /** Все сообщения чата без лимита */
  getAllMessages: (chatId: string) => Message[];
  setMessagesForChat: (chatId: string, updater: (prev: Message[]) => Message[]) => void;
  addMessageToChat: (chatId: string, message: Message) => void;
  /** Удалить сообщение (например свой комментарий) */
  deleteMessage: (chatId: string, messageId: string) => void;
  /** Обновить реакцию на сообщение (канал/пост). add: true — поставить, false — убрать */
  updateMessageReaction: (chatId: string, messageId: string, emoji: string, add: boolean) => void;
  /** Увеличить счётчик просмотров поста (канал) */
  incrementViews: (chatId: string, messageId: string) => void;
  /** Подгрузить более ранние сообщения (при скролле вверх). При API — запрос к серверу. */
  loadMoreMessages: (chatId: string) => void;
  /** Есть ли ещё более ранние сообщения для подгрузки */
  hasMoreOlder: (chatId: string) => boolean;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});
  /** По каждому чату: сколько последних сообщений показывать (при скролле вверх увеличивается) */
  const [visibleLimitByChat, setVisibleLimitByChat] = useState<Record<string, number>>({});

  const getFullMessages = useCallback(
    (chatId: string): Message[] => {
      if (messagesByChat[chatId]) return messagesByChat[chatId];
      return getMessagesForChat(chatId);
    },
    [messagesByChat]
  );

  /** Возвращает последние N сообщений (N = visibleLimit для этого чата) */
  const getMessages = useCallback(
    (chatId: string): Message[] => {
      const all = getFullMessages(chatId);
      const limit = visibleLimitByChat[chatId] ?? MESSAGES_PAGE_SIZE;
      return all.length <= limit ? all : all.slice(-limit);
    },
    [getFullMessages, visibleLimitByChat]
  );

  const loadMoreMessages = useCallback((chatId: string) => {
    setVisibleLimitByChat((prev) => {
      const current = prev[chatId] ?? MESSAGES_PAGE_SIZE;
      return { ...prev, [chatId]: current + MESSAGES_PAGE_SIZE };
    });
    // При подключении API: здесь запрос за более ранними сообщениями и append в messagesByChat
  }, []);

  const hasMoreOlder = useCallback(
    (chatId: string): boolean => {
      const all = getFullMessages(chatId);
      const limit = visibleLimitByChat[chatId] ?? MESSAGES_PAGE_SIZE;
      return all.length > limit;
    },
    [getFullMessages, visibleLimitByChat]
  );

  const setMessagesForChat = useCallback((chatId: string, updater: (prev: Message[]) => Message[]) => {
    setMessagesByChat((prev) => ({
      ...prev,
      [chatId]: updater(prev[chatId] ?? getMessagesForChat(chatId)),
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

  /** Реакция на публикацию/комментарий. Одна реакция на пользователя: tap по другой → меняет свою. */
  const updateMessageReaction = useCallback(
    (chatId: string, messageId: string, emoji: string, add: boolean) => {
      setMessagesForChat(chatId, (prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          let reactions: MessageReaction[] = [...(m.reactions ?? [])];
          if (add) {
            // Убрать текущего пользователя из всех реакций (одна реакция на пользователя)
            reactions = reactions
              .map((r) => {
                const hadUser = (r.userIds ?? []).includes(CURRENT_USER_ID);
                const nextUserIds = (r.userIds ?? []).filter((id) => id !== CURRENT_USER_ID);
                const nextCount = hadUser ? r.count - 1 : r.count;
                return { ...r, userIds: nextUserIds, count: nextCount };
              })
              .filter((r) => r.count > 0);
            let r = reactions.find((x) => x.emoji === emoji);
            if (!r) {
              reactions = [...reactions, { emoji, count: 1, userIds: [CURRENT_USER_ID] }];
            } else {
              reactions = reactions.map((x) =>
                x.emoji === emoji
                  ? { ...x, count: x.count + 1, userIds: [...(x.userIds ?? []), CURRENT_USER_ID] }
                  : x
              );
            }
          } else {
            const r = reactions.find((x) => x.emoji === emoji);
            if (!r || !(r.userIds ?? []).includes(CURRENT_USER_ID)) return m;
            const nextUserIds = (r.userIds ?? []).filter((id) => id !== CURRENT_USER_ID);
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
    [setMessagesForChat]
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
  };

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
}
