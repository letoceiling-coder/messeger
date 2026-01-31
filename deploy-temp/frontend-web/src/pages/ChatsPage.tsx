import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatsService } from '../services/chats.service';
import { usersService } from '../services/users.service';
import { Chat, User as UserType, Message } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useChats } from '../contexts/ChatsContext';
import { soundService } from '../services/sound.service';
import { callStatsService } from '../services/call-stats.service';
import { ChatListSkeleton } from '../components/ChatListSkeleton';
import { CreateGroupChatModal } from '../components/CreateGroupChatModal';
import { GlobalSearchModal } from '../components/GlobalSearchModal';
import { hasDraft } from '../utils/drafts';

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export const ChatsPage = () => {
  const { chats, setChats, loadChats, loadError, markChatAsRead } = useChats();
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showCallStats, setShowCallStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [searching, setSearching] = useState(false);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);
  
  // Поиск по чатам (отдельно от поиска пользователей)
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { socket, isUserOnline } = useWebSocket();

  const loadChatsAndFinish = useCallback(async () => {
    setLoading(true);
    await loadChats();
    setLoading(false);
  }, [loadChats]);

  useEffect(() => {
    loadChatsAndFinish();
  }, [loadChatsAndFinish]);

  // При возврате на список чатов — обновить список (актуальные последние сообщения и порядок)
  useEffect(() => {
    if (location.pathname === '/') loadChatsAndFinish();
  }, [location.pathname, loadChatsAndFinish]);

  // Обновление списка чатов при получении/отправке сообщения в реальном времени
  useEffect(() => {
    const handleMessageReceived = (message: Message) => {
      const isFromOther = message.userId !== user?.id;
      if (isFromOther) soundService.playMessageNotification();
      setChats((prev) => {
        const chatId = message.chatId;
        const updatedAt = message.createdAt || new Date().toISOString();
        const existing = prev.find((c) => c.id === chatId);
        if (!existing) return prev;
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

  // Фильтрация чатов по поисковому запросу
  const filteredChats = chatSearchQuery.trim()
    ? chats.filter((chat) => {
        const title = getChatTitle(chat).toLowerCase();
        const query = chatSearchQuery.toLowerCase();
        return title.includes(query);
      })
    : chats;

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCallStats(!showCallStats)}
            className="p-2 rounded-xl bg-[#2d2d2f] hover:bg-[#3d3d3f] transition-colors"
            title="Статистика звонков"
          >
            <span className="text-lg">📊</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl bg-[#2d2d2f] hover:bg-[#3d3d3f] transition-colors"
            title="Настройки"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2d2d2f] hover:bg-[#3d3d3f] text-sm font-medium transition-colors"
          >
            <span className="text-lg">+</span> Новый чат
          </button>
          <button
            onClick={() => setShowGroupChatModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-app-accent hover:bg-app-accent-hover text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Группа
          </button>
        </div>
      </header>

      {/* Статистика звонков */}
      {showCallStats && (() => {
        const summary = callStatsService.getStatsSummary();
        const history = callStatsService.getCallHistory().slice(0, 20);
        return (
          <div className="flex-none px-4 py-3 border-b border-white/10 bg-[#141414]">
            <h3 className="text-sm font-semibold text-[#86868a] mb-2">Статистика звонков</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>Всего: {summary.totalCalls}</span>
              <span>Видео: {summary.videoCalls}</span>
              <span>Голос: {summary.voiceCalls}</span>
              <span className="font-mono tabular-nums">Общее время: {formatDuration(summary.totalDurationSeconds)}</span>
            </div>
            {history.length > 0 && (
              <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-[#86868a] space-y-1">
                {history.map((r) => (
                  <li key={r.id}>
                    {r.contactName || r.chatId.slice(0, 8)} — {formatDuration(r.durationSeconds)} ({r.isVideo ? 'видео' : 'голос'}), {new Date(r.endedAt).toLocaleString('ru-RU')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })()}

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

      {/* Поиск по чатам */}
      {!showNewChat && chats.length > 0 && (
        <div className="flex-none px-4 py-3 border-b border-app-border">
          <div className="relative">
            <input
              type="text"
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              placeholder="Поиск по чатам..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-app-surface text-app-text placeholder-app-text-secondary focus:outline-none focus:ring-2 focus:ring-app-accent border border-app-border transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-app-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {chatSearchQuery && (
              <button
                onClick={() => setChatSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-secondary hover:text-app-text transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {chatSearchQuery.trim() && filteredChats.length === 0 && (
            <p className="text-sm text-app-text-secondary mt-2">Чаты не найдены</p>
          )}
        </div>
      )}

      {/* Список чатов */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <ChatListSkeleton />
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-app-error/10 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-app-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-app-text mb-2">Ошибка загрузки</h2>
            <p className="text-sm text-app-text-secondary mb-6 max-w-xs">
              {loadError}
            </p>
            <button
              onClick={loadChatsAndFinish}
              className="px-6 py-3 rounded-xl bg-app-accent hover:bg-app-accent-hover text-white font-medium transition-colors"
            >
              Повторить
            </button>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-app-surface flex items-center justify-center text-4xl text-app-text-secondary mb-4">
              💬
            </div>
            <h2 className="text-xl font-semibold text-app-text mb-2">Нет чатов</h2>
            <p className="text-app-text-secondary mb-6 max-w-xs">
              Нажмите «Новый чат» и найдите пользователя по имени или email, чтобы начать переписку или позвонить.
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="px-6 py-3 rounded-xl bg-app-accent hover:bg-app-accent-hover text-white font-medium transition-colors"
            >
              Найти пользователя
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {filteredChats.map((chat) => {
              const otherMember = chat.members?.find((m) => m.userId !== user?.id);
              const otherUser = otherMember?.user;
              const online = otherUser ? isUserOnline(otherUser.id, otherUser.isOnline) : false;
              const chatHasDraft = hasDraft(chat.id);
              
              return (
                <li key={chat.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markChatAsRead(chat.id);
                      navigate(`/chat/${chat.id}`);
                    }}
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
                      <div className="flex items-center gap-2">
                        {chatHasDraft && (
                          <span className="text-xs text-app-accent flex items-center gap-1">
                            <span>✏️</span>
                            <span>Черновик</span>
                          </span>
                        )}
                        <p className="text-sm text-[#86868a]">
                          {!chatHasDraft && (chat.lastMessageAt ? formatDate(chat.lastMessageAt) : online ? 'В сети' : 'Нет сообщений')}
                        </p>
                      </div>
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

      {/* Модальное окно создания группы */}
      <CreateGroupChatModal 
        isOpen={showGroupChatModal} 
        onClose={() => {
          setShowGroupChatModal(false);
          loadChatsAndFinish(); // Обновить список чатов после создания группы
        }} 
      />

      {/* Глобальный поиск */}
      <GlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />
    </div>
  );
};
