import { useState, useEffect } from 'react';
import { Message } from '../types';
import { messagesService } from '../services/messages.service';

interface ChatSearchBarProps {
  chatId: string;
  onResultClick: (messageId: string) => void;
  onClose: () => void;
}

export const ChatSearchBar = ({ chatId, onResultClick, onClose }: ChatSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const searchMessages = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await messagesService.searchInChat(chatId, query);
        setResults(data);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Ошибка поиска:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchMessages, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, chatId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      onResultClick(results[selectedIndex].id);
    }
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

  return (
    <div className="absolute top-0 left-0 right-0 z-20 bg-app-surface border-b border-app-border shadow-lg">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Поле поиска */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Поиск в чате..."
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

        {/* Навигация по результатам */}
        {results.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-app-text-secondary">
              {selectedIndex + 1} / {results.length}
            </span>
            <button
              onClick={() => setSelectedIndex((prev) => Math.max(prev - 1, 0))}
              disabled={selectedIndex === 0}
              className="p-1.5 rounded hover:bg-app-surface-hover text-app-text-secondary 
                       disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))}
              disabled={selectedIndex === results.length - 1}
              className="p-1.5 rounded hover:bg-app-surface-hover text-app-text-secondary 
                       disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-app-surface-hover text-app-text-secondary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Результаты поиска */}
      {query.trim() && (
        <div className="max-h-80 overflow-y-auto border-t border-app-border">
          {loading ? (
            <div className="px-4 py-8 text-center text-app-text-secondary">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-app-accent border-t-transparent"></div>
              <p className="mt-2 text-sm">Поиск...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-app-text-secondary">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 21a9 9 0 100-18 9 9 0 000 18z"
                />
              </svg>
              <p className="text-sm">Ничего не найдено</p>
            </div>
          ) : (
            <div className="divide-y divide-app-border">
              {results.map((message, index) => (
                <button
                  key={message.id}
                  onClick={() => onResultClick(message.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-app-surface-hover transition-colors ${
                    index === selectedIndex ? 'bg-app-bg' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Аватар */}
                    <div className="w-8 h-8 rounded-full bg-app-accent flex items-center justify-center shrink-0 text-sm">
                      {message.user?.avatarUrl ? (
                        <img
                          src={message.user.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold">
                          {message.user?.username?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>

                    {/* Контент */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-app-text">
                          {message.user?.username || 'Пользователь'}
                        </span>
                        <span className="text-xs text-app-text-secondary">
                          {new Date(message.createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-app-text line-clamp-2">
                        {highlightText(message.content ?? '', query)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
