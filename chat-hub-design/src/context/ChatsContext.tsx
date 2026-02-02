import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Chat } from '@/types/messenger';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { mapApiChatToChat, type ApiChat } from '@/services/chatMapper';

type ChatUpdate = Partial<Pick<Chat, 'isPinned' | 'isMuted' | 'isArchived' | 'unreadCount' | 'isTyping'>>;

interface ChatsContextValue {
  chats: Chat[];
  chatsLoading: boolean;
  chatsError: string | null;
  refreshChats: () => Promise<void>;
  createDirectChat: (otherUserId: string) => Promise<Chat | null>;
  /** Создать групповой чат */
  createGroupChat: (name: string, memberIds: string[], description?: string) => Promise<Chat | null>;
  updateChat: (chatId: string, update: ChatUpdate) => void;
  deleteChat: (chatId: string) => void;
  addChat: (chat: Chat) => void;
  getChatById: (chatId: string) => Chat | undefined;
  pinChat: (chatId: string, pinned: boolean) => void;
  muteChat: (chatId: string, muted: boolean) => void;
  archiveChat: (chatId: string, archived: boolean) => void;
  subscribedChannelIds: Set<string>;
  subscribeToChannel: (chatId: string) => void;
  unsubscribeFromChannel: (chatId: string) => void;
  isChannelSubscribed: (chatId: string) => boolean;
}

const ChatsContext = createContext<ChatsContextValue | null>(null);

export function ChatsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [subscribedChannelIds, setSubscribedChannelIds] = useState<Set<string>>(() => new Set());

  const loadChats = useCallback(async () => {
    if (!user?.id) {
      setChats([]);
      return;
    }
    setChatsLoading(true);
    setChatsError(null);
    try {
      const data = await api.get<ApiChat[]>('/chats');
      const mapped = (Array.isArray(data) ? data : []).map((c) =>
        mapApiChatToChat(c, user.id)
      );
      setChats(mapped);
      setSubscribedChannelIds(
        (prev) => new Set([...prev, ...mapped.filter((c) => c.isChannel).map((c) => c.id)])
      );
    } catch (err) {
      setChatsError(err instanceof Error ? err.message : 'Не удалось загрузить чаты');
      setChats([]);
    } finally {
      setChatsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadChats();
    } else {
      setChats([]);
      setChatsError(null);
    }
  }, [isAuthenticated, user?.id, loadChats]);

  const createDirectChat = useCallback(
    async (otherUserId: string): Promise<Chat | null> => {
      if (!user?.id) return null;
      try {
        const res = await api.post<ApiChat>('/chats/direct', { userId: otherUserId });
        const chat = mapApiChatToChat({ ...res, unreadCount: res.unreadCount ?? 0 }, user.id);
        addChat(chat);
        return chat;
      } catch {
        return null;
      }
    },
    [user?.id, addChat]
  );

  const createGroupChat = useCallback(
    async (name: string, memberIds: string[], description?: string): Promise<Chat | null> => {
      if (!user?.id) return null;
      try {
        const res = await api.post<ApiChat>('/chats/group', { name, memberIds, description });
        const chat = mapApiChatToChat({ ...res, unreadCount: res.unreadCount ?? 0 }, user.id);
        addChat(chat);
        return chat;
      } catch {
        return null;
      }
    },
    [user?.id, addChat]
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
      chatsLoading,
      chatsError,
      refreshChats: loadChats,
      createDirectChat,
      createGroupChat,
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
      chatsLoading,
      chatsError,
      loadChats,
      createDirectChat,
      createGroupChat,
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
