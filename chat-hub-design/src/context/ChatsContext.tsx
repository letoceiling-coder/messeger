import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Chat, Message } from '@/types/messenger';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { mapApiChatToChat, type ApiChat } from '@/services/chatMapper';

type ChatUpdate = Partial<Pick<Chat, 'isPinned' | 'isMuted' | 'isArchived' | 'unreadCount' | 'isTyping' | 'lastMessage'>>;

export interface ChatDetailsMember {
  userId: string;
  role: string;
  user: { id: string; username: string; avatarUrl: string | null };
}
export interface ChatDetails {
  id: string;
  name: string | null;
  type: string;
  members: ChatDetailsMember[];
}

interface ChatsContextValue {
  chats: Chat[];
  chatsLoading: boolean;
  chatsError: string | null;
  refreshChats: () => Promise<void>;
  createDirectChat: (otherUserId: string) => Promise<Chat | null>;
  /** Создать групповой чат */
  createGroupChat: (name: string, memberIds: string[], description?: string) => Promise<Chat | null>;
  updateChat: (chatId: string, update: ChatUpdate) => void;
  /** Обновить список чатов при новом сообщении (в реальном времени). incrementUnread=false если пользователь просматривает этот чат */
  onNewMessage: (chatId: string, message: Message, isOutgoing: boolean, incrementUnread?: boolean) => void;
  deleteChat: (chatId: string) => void;
  addChat: (chat: Chat) => void;
  getChatById: (chatId: string) => Chat | undefined;
  /** Загрузить полную информацию о чате (участники с ролями) */
  fetchChatDetails: (chatId: string) => Promise<ChatDetails | null>;
  addMember: (chatId: string, userId: string) => Promise<boolean>;
  removeMember: (chatId: string, userId: string) => Promise<boolean>;
  updateGroupChat: (chatId: string, name: string, description?: string) => Promise<boolean>;
  leaveGroup: (chatId: string) => Promise<boolean>;
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

  const addChat = useCallback((chat: Chat) => {
    setChats((prev) => [chat, ...prev]);
    if (chat.isChannel) {
      setSubscribedChannelIds((prev) => new Set(prev).add(chat.id));
    }
  }, []);

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

  const onNewMessage = useCallback((chatId: string, message: Message, isOutgoing: boolean, incrementUnread = true) => {
    setChats((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== chatId) return c;
        const addUnread = !isOutgoing && incrementUnread;
        return {
          ...c,
          lastMessage: message,
          unreadCount: isOutgoing ? (c.unreadCount ?? 0) : (addUnread ? (c.unreadCount ?? 0) + 1 : (c.unreadCount ?? 0)),
        };
      });
      const idx = updated.findIndex((c) => c.id === chatId);
      if (idx <= 0) return updated;
      const [chat] = updated.splice(idx, 1);
      return [chat, ...updated];
    });
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
  }, []);

  const getChatById = useCallback(
    (chatId: string) => chats.find((c) => c.id === chatId),
    [chats]
  );

  const fetchChatDetails = useCallback(async (chatId: string): Promise<ChatDetails | null> => {
    try {
      const data = await api.get<ChatDetails & { members: ChatDetailsMember[] }>(`/chats/${chatId}`);
      return data ? { id: data.id, name: data.name, type: data.type, members: data.members ?? [] } : null;
    } catch {
      return null;
    }
  }, []);

  const addMember = useCallback(async (chatId: string, userId: string): Promise<boolean> => {
    try {
      await api.post(`/chats/${chatId}/members`, { userId });
      await loadChats();
      return true;
    } catch {
      return false;
    }
  }, [loadChats]);

  const removeMember = useCallback(async (chatId: string, userId: string): Promise<boolean> => {
    try {
      await api.delete(`/chats/${chatId}/members/${userId}`);
      await loadChats();
      return true;
    } catch {
      return false;
    }
  }, [loadChats]);

  const updateGroupChat = useCallback(async (chatId: string, name: string, description?: string): Promise<boolean> => {
    try {
      await api.patch(`/chats/${chatId}/group`, { name, description });
      updateChat(chatId, { name });
      return true;
    } catch {
      return false;
    }
  }, [updateChat]);

  const leaveGroup = useCallback(async (chatId: string): Promise<boolean> => {
    try {
      await api.post(`/chats/${chatId}/leave`);
      deleteChat(chatId);
      return true;
    } catch {
      return false;
    }
  }, [deleteChat]);

  const pinChat = useCallback(
    async (chatId: string, pinned: boolean) => {
      updateChat(chatId, { isPinned: pinned });
      try {
        await api.patch(`/chats/${chatId}/pin-chat`, { pinned });
      } catch {
        updateChat(chatId, { isPinned: !pinned });
      }
    },
    [updateChat]
  );

  const muteChat = useCallback((chatId: string, muted: boolean) => {
    updateChat(chatId, { isMuted: muted });
  }, [updateChat]);

  const archiveChat = useCallback(
    async (chatId: string, archived: boolean) => {
      updateChat(chatId, { isArchived: archived });
      try {
        await api.patch(`/chats/${chatId}/archive`, { archived });
      } catch {
        updateChat(chatId, { isArchived: !archived });
      }
    },
    [updateChat]
  );

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
      onNewMessage,
      deleteChat,
      getChatById,
      fetchChatDetails,
      addMember,
      removeMember,
      updateGroupChat,
      leaveGroup,
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
      onNewMessage,
      deleteChat,
      getChatById,
      fetchChatDetails,
      addMember,
      removeMember,
      updateGroupChat,
      leaveGroup,
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
