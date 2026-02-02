import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Chat } from '@/types/messenger';
import { chats as initialChats } from '@/data/mockData';

type ChatUpdate = Partial<Pick<Chat, 'isPinned' | 'isMuted' | 'isArchived' | 'unreadCount' | 'isTyping'>>;

interface ChatsContextValue {
  chats: Chat[];
  updateChat: (chatId: string, update: ChatUpdate) => void;
  deleteChat: (chatId: string) => void;
  addChat: (chat: Chat) => void;
  getChatById: (chatId: string) => Chat | undefined;
  pinChat: (chatId: string, pinned: boolean) => void;
  muteChat: (chatId: string, muted: boolean) => void;
  archiveChat: (chatId: string, archived: boolean) => void;
  /** Каналы: подписка как в Telegram */
  subscribedChannelIds: Set<string>;
  subscribeToChannel: (chatId: string) => void;
  unsubscribeFromChannel: (chatId: string) => void;
  isChannelSubscribed: (chatId: string) => boolean;
}

const ChatsContext = createContext<ChatsContextValue | null>(null);

export function ChatsProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>(() => [...initialChats]);
  const [subscribedChannelIds, setSubscribedChannelIds] = useState<Set<string>>(
    () => new Set(initialChats.filter((c) => c.isChannel).map((c) => c.id))
  );

  const updateChat = useCallback((chatId: string, update: ChatUpdate) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, ...update } : c))
    );
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
  }, []);

  const addChat = useCallback((chat: Chat) => {
    setChats((prev) => [chat, ...prev]);
    if (chat.isChannel) {
      setSubscribedChannelIds((prev) => new Set(prev).add(chat.id));
    }
  }, []);

  const getChatById = useCallback(
    (chatId: string) => chats.find((c) => c.id === chatId),
    [chats]
  );

  const pinChat = useCallback((chatId: string, pinned: boolean) => {
    updateChat(chatId, { isPinned: pinned });
  }, [updateChat]);

  const muteChat = useCallback((chatId: string, muted: boolean) => {
    updateChat(chatId, { isMuted: muted });
  }, [updateChat]);

  const archiveChat = useCallback((chatId: string, archived: boolean) => {
    updateChat(chatId, { isArchived: archived });
  }, [updateChat]);

  const subscribeToChannel = useCallback((chatId: string) => {
    setSubscribedChannelIds((prev) => new Set(prev).add(chatId));
  }, []);

  const unsubscribeFromChannel = useCallback((chatId: string) => {
    setSubscribedChannelIds((prev) => {
      const next = new Set(prev);
      next.delete(chatId);
      return next;
    });
  }, []);

  const isChannelSubscribed = useCallback(
    (chatId: string) => subscribedChannelIds.has(chatId),
    [subscribedChannelIds]
  );

  const value = useMemo<ChatsContextValue>(
    () => ({
      chats,
      addChat,
      updateChat,
      deleteChat,
      getChatById,
      pinChat,
      muteChat,
      archiveChat,
      subscribedChannelIds,
      subscribeToChannel,
      unsubscribeFromChannel,
      isChannelSubscribed,
    }),
    [
      chats,
      updateChat,
      deleteChat,
      addChat,
      getChatById,
      pinChat,
      muteChat,
      archiveChat,
      subscribedChannelIds,
      subscribeToChannel,
      unsubscribeFromChannel,
      isChannelSubscribed,
    ]
  );

  return (
    <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>
  );
}

export function useChats() {
  const ctx = useContext(ChatsContext);
  if (!ctx) throw new Error('useChats must be used within ChatsProvider');
  return ctx;
}
