import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Archive } from 'lucide-react';
import ChatListHeader from '@/components/chats/ChatListHeader';
import ChatListItem from '@/components/chats/ChatListItem';
import EmptyState from '@/components/common/EmptyState';
import { PullToRefresh } from '@/components/common/PullToRefresh';
import { ChatListSkeleton } from '@/components/common/ChatListSkeleton';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useChats } from '@/context/ChatsContext';
import { useMessages } from '@/context/MessagesContext';
import { useAuth } from '@/context/AuthContext';
import { Chat, Message } from '@/types/messenger';
import { api } from '@/services/api';
import { mapApiMessageToMessage, type ApiMessage } from '@/services/messageMapper';
import { formatMessageTime } from '@/data/mockData';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type GlobalSearchItem = { message: Message; chatName: string };

const ChatsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chats, chatsLoading, chatsError, refreshChats, pinChat, muteChat, archiveChat, deleteChat, getChatById } = useChats();
  const { getMessages } = useMessages();
  const [searchQuery, setSearchQuery] = useState('');
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [openedChatId, setOpenedChatId] = useState<string | null>(null);
  const [globalSearchResults, setGlobalSearchResults] = useState<GlobalSearchItem[]>([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const globalSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doRefresh = async () => {
    await refreshChats();
  };

  // Глобальный поиск по сообщениям (debounce)
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setGlobalSearchResults([]);
      return;
    }
    if (globalSearchDebounceRef.current) clearTimeout(globalSearchDebounceRef.current);
    globalSearchDebounceRef.current = setTimeout(() => {
      globalSearchDebounceRef.current = null;
      setGlobalSearchLoading(true);
      api
        .get<(ApiMessage & { chat?: { name: string } })[]>(`/messages/search/global?q=${encodeURIComponent(q)}`)
        .then((list) => {
          const items: GlobalSearchItem[] = (Array.isArray(list) ? list : []).map((m) => ({
            message: mapApiMessageToMessage(m, user?.id ?? ''),
            chatName: m.chat?.name ?? getChatById(m.chatId)?.name ?? 'Чат',
          }));
          setGlobalSearchResults(items);
        })
        .catch(() => setGlobalSearchResults([]))
        .finally(() => setGlobalSearchLoading(false));
    }, 300);
    return () => {
      if (globalSearchDebounceRef.current) clearTimeout(globalSearchDebounceRef.current);
    };
  }, [searchQuery, user?.id, getChatById]);

  const handleGlobalSearchResultClick = useCallback(
    (item: GlobalSearchItem) => {
      navigate(`/chat/${item.message.chatId}`, {
        state: { scrollToMessageId: item.message.id },
      });
      setSearchQuery('');
      setGlobalSearchResults([]);
    },
    [navigate]
  );

  const { pullY, refreshing, progress, handlers } = usePullToRefresh({
    onRefresh: doRefresh,
    enabled: true,
  });

  const sortedChats = useMemo(() => {
    let filtered = [...chats].filter((chat) => !chat.isArchived);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (chat) =>
          chat.name.toLowerCase().includes(query) ||
          (chat.lastMessage?.content ?? '').toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = a.lastMessage?.timestamp.getTime() || 0;
      const timeB = b.lastMessage?.timestamp.getTime() || 0;
      return timeB - timeA;
    });
  }, [chats, searchQuery, getMessages]);

  const archivedChats = useMemo(
    () =>
      [...chats]
        .filter((c) => c.isArchived)
        .sort((a, b) => {
          const timeA = a.lastMessage?.timestamp.getTime() || 0;
          const timeB = b.lastMessage?.timestamp.getTime() || 0;
          return timeB - timeA;
        }),
    [chats]
  );

  const handleChatClick = (chat: Chat) => {
    navigate(`/chat/${chat.id}`);
  };

  const handleDeleteConfirm = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete.id);
      setChatToDelete(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <ChatListHeader searchQuery={searchQuery} onSearch={setSearchQuery} onMenuClick={() => setMenuOpen(true)} />

      <PullToRefresh pullY={pullY} refreshing={refreshing} progress={progress} handlers={handlers}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 min-h-0 overflow-auto divide-y divide-border"
          style={{ touchAction: 'pan-y' }}
        >
          {chatsLoading && chats.length === 0 ? (
            <ChatListSkeleton />
          ) : chatsError ? (
            <div className="p-4 flex flex-col items-center gap-3">
              <p className="text-destructive text-sm text-center">{chatsError}</p>
              <button
                type="button"
                onClick={() => refreshChats()}
                className="text-sm font-medium text-primary hover:underline"
              >
                Повторить
              </button>
            </div>
          ) : (
            <>
              {/* Глобальный поиск по сообщениям */}
              {searchQuery.trim().length >= 2 && (
                <div className="border-b border-border">
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Сообщения
                  </div>
                  {globalSearchLoading ? (
                    <div className="px-4 py-6 text-sm text-muted-foreground">Поиск...</div>
                  ) : globalSearchResults.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {globalSearchResults.map((item) => (
                        <button
                          key={item.message.id}
                          type="button"
                          onClick={() => handleGlobalSearchResultClick(item)}
                          className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors"
                        >
                          <p className="text-xs text-muted-foreground truncate">{item.chatName}</p>
                          <p className="text-sm truncate mt-0.5">{item.message.content || '(медиа)'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatMessageTime(item.message.timestamp)}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    !globalSearchLoading &&
                    sortedChats.length > 0 && (
                      <div className="px-4 py-4 text-sm text-muted-foreground">
                        В сообщениях ничего не найдено
                      </div>
                    )
                  )}
                </div>
              )}
              {/* Чаты */}
              {sortedChats.length > 0 ? (
                sortedChats.map((chat) => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    onClick={() => handleChatClick(chat)}
                    onPin={(c) => pinChat(c.id, !c.isPinned)}
                    onMute={(c) => muteChat(c.id, !c.isMuted)}
                    onArchive={(c) => archiveChat(c.id, !c.isArchived)}
                    onDelete={(c) => setChatToDelete(c)}
                    isRevealed={openedChatId === chat.id}
                    onRevealChange={setOpenedChatId}
                  />
                ))
              ) : !searchQuery.trim() ? (
                <EmptyState
                  icon={MessageCircle}
                  title="Нет чатов"
                  description="Начните общение — выберите контакт или создайте новый чат"
                />
              ) : searchQuery.trim().length < 2 ? (
                <EmptyState
                  icon={MessageCircle}
                  title="Чаты не найдены"
                  description="Попробуйте изменить поисковый запрос"
                />
              ) : null}
              {searchQuery.trim().length >= 2 && sortedChats.length === 0 && globalSearchResults.length === 0 && !globalSearchLoading && (
                <EmptyState
                  icon={MessageCircle}
                  title="Ничего не найдено"
                  description="Попробуйте изменить поисковый запрос"
                />
              )}
              {/* Архивированные чаты — только когда не активен поиск */}
              {!searchQuery.trim() && archivedChats.length > 0 && (
                <div className="border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowArchived(!showArchived)}
                    className="w-full px-4 py-3 flex items-center gap-2 text-left text-sm font-medium text-muted-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <Archive className="h-4 w-4 shrink-0" />
                    Архивированные ({archivedChats.length})
                  </button>
                  {showArchived && (
                    <div className="divide-y divide-border">
                      {archivedChats.map((chat) => (
                        <ChatListItem
                          key={chat.id}
                          chat={chat}
                          onClick={() => handleChatClick(chat)}
                          onPin={(c) => pinChat(c.id, !c.isPinned)}
                          onMute={(c) => muteChat(c.id, !c.isMuted)}
                          onArchive={(c) => archiveChat(c.id, false)}
                          onDelete={(c) => setChatToDelete(c)}
                          isRevealed={openedChatId === chat.id}
                          onRevealChange={setOpenedChatId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </motion.div>
      </PullToRefresh>

      <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
        <AlertDialogContent className="rounded-2xl shadow-modal max-w-[calc(100%-32px)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить чат?</AlertDialogTitle>
            <AlertDialogDescription>
              История переписки с {chatToDelete?.name} будет удалена. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SideMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </div>
  );
};

export default ChatsPage;
