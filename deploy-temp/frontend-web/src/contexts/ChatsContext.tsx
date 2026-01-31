import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { Chat } from '../types';
import { chatsService } from '../services/chats.service';

interface ChatsContextType {
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  loadChats: () => Promise<void>;
  loadError: string | null;
  /** Вызвать при переходе в чат: обнуляет счётчик непрочитанных в списке при возврате */
  markChatAsRead: (chatId: string) => void;
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);

export const ChatsProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const openedChatIdsRef = useRef<Set<string>>(new Set());

  const markChatAsRead = useCallback((chatId: string) => {
    openedChatIdsRef.current.add(chatId);
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  const loadChats = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await chatsService.getChats();
      const opened = openedChatIdsRef.current;
      setChats(
        data.map((chat) => ({
          ...chat,
          unreadCount: opened.has(chat.id) ? 0 : (chat.unreadCount ?? 0),
        }))
      );
    } catch (error: any) {
      console.error('Ошибка загрузки чатов:', error);
      setLoadError(error?.response?.data?.message || 'Не удалось загрузить список чатов');
    }
  }, []);

  return (
    <ChatsContext.Provider value={{ chats, setChats, loadChats, loadError, markChatAsRead }}>
      {children}
    </ChatsContext.Provider>
  );
};

const defaultContextValue: ChatsContextType = {
  chats: [],
  setChats: () => {},
  loadChats: async () => {},
  loadError: null,
  markChatAsRead: () => {},
};

export const useChats = () => {
  const ctx = useContext(ChatsContext);
  if (ctx === undefined) {
    if (typeof window !== 'undefined') {
      console.warn('useChats used outside ChatsProvider — using fallback. Wrap app with ChatsProvider.');
    }
    return defaultContextValue;
  }
  return ctx;
};
