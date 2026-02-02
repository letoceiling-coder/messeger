import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Message } from '@/types/messenger';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import UserAvatar from '@/components/common/Avatar';
import { formatMessageTime } from '@/data/mockData';
import { currentUser, getContactById } from '@/data/mockData';
import { useMessages } from '@/context/MessagesContext';
import { useChats } from '@/context/ChatsContext';
import { ArrowLeft, Send, Reply, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function getSenderName(senderId: string): string {
  if (senderId === currentUser.id) return 'Вы';
  return getContactById(senderId)?.name ?? senderId;
}

export default function PostCommentsPage() {
  const { chatId, postId } = useParams<{ chatId: string; postId: string }>();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [replyToComment, setReplyToComment] = useState<Message | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { getMessages, addMessageToChat, updateMessageReaction } = useMessages();
  const { getChatById } = useChats();

  const chat = chatId ? getChatById(chatId) : null;
  const allMessages = chatId ? getMessages(chatId) : [];
  const post = allMessages.find((m) => m.id === postId);

  useEffect(() => {
    if (chatId && (!chat || !post)) {
      navigate(chatId ? `/chat/${chatId}` : '/', { replace: true });
    }
  }, [chatId, chat, post, navigate]);

  const commentIds = new Set<string>(post ? [post.id] : []);
  let changed = true;
  while (changed) {
    changed = false;
    for (const m of allMessages) {
      if (m.replyTo && commentIds.has(m.replyTo) && !commentIds.has(m.id)) {
        commentIds.add(m.id);
        changed = true;
      }
    }
  }
  const comments = allMessages
    .filter((m) => m.replyTo && commentIds.has(m.replyTo) && m.id !== post?.id)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || !chatId || !post) return;
    const parentId = replyToComment?.id ?? post.id;
    addMessageToChat(chatId, {
      id: `comment-${Date.now()}`,
      chatId,
      senderId: currentUser.id,
      type: 'text',
      content: text,
      timestamp: new Date(),
      status: 'sent',
      isOutgoing: true,
      replyTo: parentId,
    });
    setInputValue('');
    setReplyToComment(null);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasUserReaction = (msg: Message, emoji: string) =>
    (msg.reactions ?? []).some((r) => r.emoji === emoji && (r.userIds ?? []).includes(currentUser.id));

  if (!chat || !post) return null;

  const channelName = chat.name;

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Шапка: назад + заголовок */}
      <header className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full"
          aria-label="Назад"
          onClick={() => navigate(chatId ? `/chat/${chatId}` : '/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground truncate flex-1">
          Комментарии — {channelName}
        </h1>
      </header>

      {/* Превью поста */}
      <div className="py-2 px-3 border-b border-border shrink-0">
        <p className="text-xs text-[#A9A9A9] truncate">
          {post.type === 'text' ? post.content : post.content || 'Медиа'}
        </p>
      </div>

      {/* Список комментариев */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-[#A9A9A9] text-center py-8">
            Нет комментариев.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex gap-2',
                  msg.isOutgoing ? 'flex-row-reverse' : ''
                )}
              >
                <UserAvatar
                  name={getSenderName(msg.senderId)}
                  size="sm"
                  className="shrink-0 h-8 w-8"
                />
                <div
                  className={cn(
                    'flex-1 min-w-0 max-w-[85%]',
                    msg.isOutgoing ? 'flex flex-col items-end' : ''
                  )}
                >
                  <div
                    className={cn(
                      'rounded-bubble px-3 py-2 group border',
                      msg.isOutgoing
                        ? 'rounded-bubble-outgoing bg-white dark:bg-white/95 text-[#333] border-[#A9A9A9]/50'
                        : 'rounded-bubble-incoming bg-muted border-transparent'
                    )}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <p className="text-base font-bold leading-tight mb-0.5" style={{ fontSize: 16, color: msg.isOutgoing ? '#333' : undefined }}>
                      {getSenderName(msg.senderId)}
                    </p>
                    <p className="text-sm break-words" style={{ color: msg.isOutgoing ? '#333' : '#333333', fontSize: 14 }}>
                      {msg.content}
                    </p>
                    <span className="text-xs italic block mt-1" style={{ color: '#A9A9A9', fontSize: 12 }}>
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-1.5 text-xs text-muted-foreground"
                      onClick={() => {
                        setReplyToComment(msg);
                        textareaRef.current?.focus();
                      }}
                    >
                      <Reply className="h-3.5 w-3.5 mr-1" />
                      Ответить
                    </Button>
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        type="button"
                        onClick={() => chatId && updateMessageReaction(chatId, msg.id, '👍', !hasUserReaction(msg, '👍'))}
                        className={cn(
                          'p-1 rounded',
                          hasUserReaction(msg, '👍') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'
                        )}
                        aria-label="Лайк"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {(msg.reactions ?? []).find((r) => r.emoji === '👍')?.count ?? 0}
                      </button>
                      <button
                        type="button"
                        onClick={() => chatId && updateMessageReaction(chatId, msg.id, '👎', !hasUserReaction(msg, '👎'))}
                        className={cn(
                          'p-1 rounded',
                          hasUserReaction(msg, '👎') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'
                        )}
                        aria-label="Дизлайк"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        {(msg.reactions ?? []).find((r) => r.emoji === '👎')?.count ?? 0}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Ответ на комментарий */}
      {replyToComment && (
        <div className="shrink-0 px-3 py-2 bg-muted/60 border-b border-border flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground truncate">
            Ответ на {getSenderName(replyToComment.senderId)}
          </span>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setReplyToComment(null)}>
            Отмена
          </Button>
        </div>
      )}

      {/* Поле ввода */}
      <div className="shrink-0 p-2 border-t border-border bg-background flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={replyToComment ? 'Ответ на комментарий...' : 'Написать комментарий...'}
          rows={1}
          className={cn(
            'min-h-[40px] max-h-[100px] resize-none border-2 rounded-lg transition-colors flex-1',
            'border-input focus-visible:border-[#006CFF] focus-visible:ring-2 focus-visible:ring-[#006CFF]/20'
          )}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!inputValue.trim()}
          className="shrink-0 rounded-full bg-primary disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
