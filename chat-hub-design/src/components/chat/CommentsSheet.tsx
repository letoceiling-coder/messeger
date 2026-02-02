import { useState, useRef, useEffect } from 'react';
import type { Message } from '@/types/messenger';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import UserAvatar from '@/components/common/Avatar';
import { formatMessageTime } from '@/data/mockData';
import { currentUser, getContactById } from '@/data/mockData';
import { useMessages } from '@/context/MessagesContext';
import { Send, Reply, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  post: Message;
  channelName: string;
}

function getSenderName(senderId: string): string {
  if (senderId === currentUser.id) return 'Вы';
  return getContactById(senderId)?.name ?? senderId;
}

export default function CommentsSheet({
  open,
  onOpenChange,
  chatId,
  post,
  channelName,
}: CommentsSheetProps) {
  const [inputValue, setInputValue] = useState('');
  const [replyToComment, setReplyToComment] = useState<Message | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { getMessages, addMessageToChat, deleteMessage, updateMessageReaction } = useMessages();

  const allMessages = getMessages(chatId);
  const commentIds = new Set<string>([post.id]);
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
    .filter((m) => m.replyTo && commentIds.has(m.replyTo) && m.id !== post.id)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Сначала свежие

  useEffect(() => {
    if (open) {
      setInputValue('');
      setReplyToComment(null);
    }
  }, [open]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] flex flex-col rounded-t-2xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Комментарии — {channelName}</SheetTitle>
        </SheetHeader>

        {/* Превью поста */}
        <div className="py-2 px-1 border-b border-border shrink-0">
          <p className="text-xs text-[#A9A9A9] truncate">
            {post.type === 'text' ? post.content : post.content || 'Медиа'}
          </p>
        </div>

        {/* Список комментариев — имя 16px bold, текст 14px #333, дата 12px italic #A9A9A9, аватар 32px */}
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
                        'rounded-bubble px-3 py-2 group',
                        msg.isOutgoing
                          ? 'rounded-bubble-outgoing bg-primary text-primary-foreground'
                          : 'rounded-bubble-incoming bg-muted'
                      )}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <p className="text-base font-bold leading-tight mb-0.5" style={{ fontSize: 16 }}>
                        {getSenderName(msg.senderId)}
                      </p>
                      <p className="text-sm break-words" style={{ color: msg.isOutgoing ? undefined : '#333333', fontSize: 14 }}>
                        {msg.content}
                      </p>
                      <span className="text-xs italic block mt-1" style={{ color: '#A9A9A9', fontSize: 12 }}>
                        {formatMessageTime(msg.timestamp)}
                      </span>
                    </div>
                    {/* Ответить (long-press заменён на кнопку), Удалить (свой), Лайк/дизлайк */}
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
                      {msg.senderId === currentUser.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-1.5 text-xs text-destructive"
                          onClick={() => deleteMessage(chatId, msg.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Удалить
                        </Button>
                      )}
                      <div className="flex items-center gap-0.5 ml-1">
                        <button
                          type="button"
                          onClick={() => updateMessageReaction(chatId, msg.id, '👍', !hasUserReaction(msg, '👍'))}
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
                          onClick={() => updateMessageReaction(chatId, msg.id, '👎', !hasUserReaction(msg, '👎'))}
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
          <div className="shrink-0 px-2 py-1 bg-muted/60 border-b border-border flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground truncate">
              Ответ на {getSenderName(replyToComment.senderId)}
            </span>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setReplyToComment(null)}>
              Отмена
            </Button>
          </div>
        )}

        {/* Поле ввода: серая обводка, при фокусе синяя #006CFF; кнопка неактивна когда пусто */}
        <div className="shrink-0 p-2 border-t border-border bg-background flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={replyToComment ? 'Ответ на комментарий...' : 'Написать комментарий...'}
            rows={1}
            className={cn(
              'min-h-[40px] max-h-[100px] resize-none border-2 rounded-lg transition-colors',
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
      </SheetContent>
    </Sheet>
  );
}
