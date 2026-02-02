import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Message } from '../types';
import { messagesService } from '../services/messages.service';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal = ({ isOpen, onClose }: GlobalSearchModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchMessages = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await messagesService.searchGlobal(query);
        setResults(data);
      } catch (error) {
        console.error('Ошибка поиска:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchMessages, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = (message: Message) => {
    onClose();
    navigate(`/chat/${message.chatId}?messageId=${message.id}`);
  };

  const getChatName = (message: Message) => {
    if (message.chat?.type === 'group') {
      return message.chat.name || 'Группа';
    }
    // Для личных чатов - имя собеседника
    const otherMember = message.chat?.members?.find((m: { userId: string }) => m.userId !== message.userId);
    return otherMember?.user?.username || 'Личный чат';
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={i} className="bg-yellow-400 text-black">{part}</mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-app-surface rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Шапка */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-app-border shrink-0">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по всем чатам..."
              className="w-full px-4 py-2 pl-10 bg-app-bg border border-app-border rounded-xl 
                       text-app-text placeholder-app-text-secondary
                       focus:outline-none focus:border-app-accent transition-colors"
              autoFocus
            />
            <svg
              className="w-5 h-5 text-app-text-secondary absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-app-surface-hover text-app-text-secondary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Результаты */}
        <div className="flex-1 overflow-y-auto">
          {!query.trim() ? (
            <div className="px-6 py-12 text-center text-app-text-secondary">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-lg font-medium mb-1">Глобальный поиск</p>
              <p className="text-sm">Введите запрос для поиска по всем вашим чатам</p>
            </div>
          ) : loading ? (
            <div className="px-6 py-12 text-center text-app-text-secondary">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-app-accent border-t-transparent"></div>
              <p className="mt-3 text-sm">Поиск...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-6 py-12 text-center text-app-text-secondary">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 21a9 9 0 100-18 9 9 0 000 18z"
                />
              </svg>
              <p className="text-lg font-medium mb-1">Ничего не найдено</p>
              <p className="text-sm">Попробуйте изменить запрос</p>
            </div>
          ) : (
            <div className="divide-y divide-app-border">
              {results.map((message) => (
                <button
                  key={message.id}
                  onClick={() => handleResultClick(message)}
                  className="w-full px-6 py-4 text-left hover:bg-app-surface-hover transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Аватар */}
                    <div className="w-10 h-10 rounded-full bg-app-accent flex items-center justify-center shrink-0">
                      {message.user?.avatarUrl ? (
                        <img
                          src={message.user.avatarUrl}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold">
                          {message.user?.username?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>

                    {/* Контент */}
                    <div className="flex-1 min-w-0">
                      {/* Имя чата */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-app-accent font-medium">
                          {getChatName(message)}
                        </span>
                        {message.chat?.type === 'group' && (
                          <svg className="w-3 h-3 text-app-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                        )}
                      </div>

                      {/* Отправитель и дата */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-app-text">
                          {message.user?.username || 'Пользователь'}
                        </span>
                        <span className="text-xs text-app-text-secondary">
                          {new Date(message.createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Текст сообщения */}
                      <p className="text-sm text-app-text line-clamp-2">
                        {highlightText(message.content ?? '', query)}
                      </p>
                    </div>

                    {/* Стрелка */}
                    <svg
                      className="w-5 h-5 text-app-text-secondary shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Подсказки */}
        {results.length > 0 && (
          <div className="px-6 py-3 border-t border-app-border text-xs text-app-text-secondary text-center shrink-0">
            Найдено: {results.length} {results.length === 1 ? 'сообщение' : results.length < 5 ? 'сообщения' : 'сообщений'}
          </div>
        )}
      </div>
    </div>
  );
};
