import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatsService } from '../services/chats.service';
import { usersService } from '../services/users.service';
import { Chat, User as UserType, Message } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';

export const ChatsPage = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [searching, setSearching] = useState(false);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { socket, isUserOnline } = useWebSocket();

  const loadChats = useCallback(async () => {
    try {
      const data = await chatsService.getChats();
      setChats(data);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // При возврате на список чатов — обновить список (актуальные последние сообщения и порядок)
  useEffect(() => {
    if (location.pathname === '/') loadChats();
  }, [location.pathname, loadChats]);

  // Обновление списка чатов при получении/отправке сообщения в реальном времени
  useEffect(() => {
    const handleMessageReceived = (message: Message) => {
      setChats((prev) => {
        const chatId = message.chatId;
        const updatedAt = message.createdAt || new Date().toISOString();
        const existing = prev.find((c) => c.id === chatId);
        if (!existing) return prev;
        const isFromOther = message.userId !== user?.id;
        const updated: Chat = {
          ...existing,
          lastMessageAt: updatedAt,
          unreadCount: isFromOther ? (existing.unreadCount ?? 0) + 1 : (existing.unreadCount ?? 0),
        };
        return [updated, ...prev.filter((c) => c.id !== chatId)];
      });
    };
    socket.onMessageReceived(handleMessageReceived);
    return () => socket.offMessageReceived(handleMessageReceived);
  }, [socket, user?.id]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await usersService.searchUsers(searchQuery);
        setSearchResults(users);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleStartChat = async (otherUser: UserType) => {
    if (creatingChat === otherUser.id) return;
    setCreatingChat(otherUser.id);
    try {
      const chat = await chatsService.createDirectChat(otherUser.id);
      setChats((prev) => [chat, ...prev.filter((c) => c.id !== chat.id)]);
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
      navigate(`/chat/${chat.id}`);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Не удалось создать чат');
    } finally {
      setCreatingChat(null);
    }
  };

  const getChatTitle = (chat: Chat) => {
    if (chat.name) return chat.name;
    if (chat.members?.length) {
      const other = chat.members.find((m) => m.userId !== user?.id);
      return other?.user?.username || other?.user?.email || 'Чат';
    }
    return `Чат ${chat.id.slice(0, 8)}`;
  };

  const getChatAvatarLetter = (chat: Chat) => {
    const title = getChatTitle(chat);
    return title.charAt(0).toUpperCase();
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString('ru-RU', { weekday: 'short' });
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-0 bg-[#0b0b0b]">
        <div className="text-[#86868a]">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#0b0b0b] text-white">
      {/* Шапка — всегда видна */}
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#2d2d2f] flex items-center justify-center text-sm font-semibold">
            {user?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-lg font-semibold">{user?.username}</h1>
            <p className="text-xs text-[#86868a]">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewChat(!showNewChat)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2d2d2f] hover:bg-[#3d3d3f] text-sm font-medium"
        >
          <span className="text-lg">+</span> Новый чат
        </button>
      </header>

      {/* Поиск пользователей (новый чат) */}
      {showNewChat && (
        <div className="flex-none px-4 py-3 border-b border-white/10 bg-[#141414]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="w-full px-4 py-2.5 rounded-xl bg-[#2d2d2f] text-white placeholder-[#86868a] focus:outline-none focus:ring-2 focus:ring-[#0a84ff]"
            autoFocus
          />
          {searching && <p className="text-sm text-[#86868a] mt-2">Поиск...</p>}
          {searchQuery.trim() && !searching && searchResults.length === 0 && (
            <p className="text-sm text-[#86868a] mt-2">Никого не найдено</p>
          )}
          {searchResults.length > 0 && (
            <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl bg-[#2d2d2f] divide-y divide-white/10">
              {searchResults.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => handleStartChat(u)}
                    disabled={creatingChat === u.id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#3d3d3f] flex items-center justify-center text-sm font-semibold">
                      {u.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{u.username}</p>
                      <p className="text-xs text-[#86868a] truncate">{u.email}</p>
                    </div>
                    {creatingChat === u.id ? (
                      <span className="text-xs text-[#86868a]">Создание...</span>
                    ) : (
                      <span className="text-xs text-[#0a84ff]">Написать</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Список чатов */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[#2d2d2f] flex items-center justify-center text-4xl text-[#86868a] mb-4">
              💬
            </div>
            <h2 className="text-xl font-semibold mb-2">Нет чатов</h2>
            <p className="text-[#86868a] mb-6 max-w-xs">
              Нажмите «Новый чат» и найдите пользователя по имени или email, чтобы начать переписку или позвонить.
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="px-6 py-3 rounded-xl bg-[#0a84ff] hover:bg-[#409cff] font-medium"
            >
              Найти пользователя
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {chats.map((chat) => {
              const otherMember = chat.members?.find((m) => m.userId !== user?.id);
              const otherUser = otherMember?.user;
              const online = otherUser ? isUserOnline(otherUser.id, otherUser.isOnline) : false;
              return (
                <li key={chat.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/10 text-left"
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-[#2d2d2f] flex items-center justify-center text-lg font-semibold">
                        {getChatAvatarLetter(chat)}
                      </div>
                      {online && (
                        <span
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0b0b0b]"
                          title="В сети"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{getChatTitle(chat)}</p>
                      <p className="text-sm text-[#86868a]">
                        {chat.lastMessageAt ? formatDate(chat.lastMessageAt) : online ? 'В сети' : 'Нет сообщений'}
                      </p>
                    </div>
                    {(chat.unreadCount ?? 0) > 0 && (
                      <span
                        className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#0a84ff] text-white text-xs font-medium flex items-center justify-center"
                        title="Непрочитанные сообщения"
                      >
                        {chat.unreadCount! > 99 ? '99+' : chat.unreadCount}
                      </span>
                    )}
                    <span className="text-[#86868a] text-sm shrink-0">→</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Выход внизу */}
      <div className="flex-none px-4 py-3 border-t border-white/10">
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="text-sm text-[#86868a] hover:text-white"
        >
          Выйти
        </button>
      </div>
    </div>
  );
};
