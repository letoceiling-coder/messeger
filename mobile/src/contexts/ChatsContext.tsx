import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {Chat} from '@types/index';
import api from '@services/api';
import {ENDPOINTS} from '@config/api';
import {useAuth} from './AuthContext';

interface ChatsContextType {
  chats: Chat[];
  isLoading: boolean;
  refreshChats: () => Promise<void>;
  markChatAsRead: (chatId: string) => void;
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);

export const ChatsProvider = ({children}: {children: ReactNode}) => {
  const {isAuthenticated} = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      refreshChats();
    }
  }, [isAuthenticated]);

  const refreshChats = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<Chat[]>(ENDPOINTS.CHATS);
      setChats(data);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markChatAsRead = (chatId: string) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId ? {...chat, unreadCount: 0} : chat,
      ),
    );
  };

  return (
    <ChatsContext.Provider
      value={{
        chats,
        isLoading,
        refreshChats,
        markChatAsRead,
      }}>
      {children}
    </ChatsContext.Provider>
  );
};

export const useChats = () => {
  const context = useContext(ChatsContext);
  if (!context) {
    throw new Error('useChats должен использоваться внутри ChatsProvider');
  }
  return context;
};
