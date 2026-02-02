import { useState } from 'react';
import type { Message, MessageReaction } from '@/types/messenger';
import { formatViews } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { MessageCircle, Eye, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion } from 'framer-motion';

/** Основной набор реакций по спецификации: 👍, ❤️, 😂, 😮, 😢, 😡 */
const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

interface ChannelPostFooterProps {
  post: Message;
  chatId: string;
  commentCount: number;
  onOpenComments: () => void;
  onReaction: (emoji: string, add: boolean) => void;
  currentUserId?: string;
}

export default function ChannelPostFooter({
  post,
  chatId: _chatId,
  commentCount,
  onOpenComments,
  onReaction,
  currentUserId = 'user-1',
}: ChannelPostFooterProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const views = post.views ?? 0;
  const reactions = post.reactions ?? [];

  const hasUserReaction = (r: MessageReaction) => r.userIds?.includes(currentUserId) ?? false;

  return (
    <div className="flex flex-col gap-y-2 mt-2 px-1 text-muted-foreground">
      {/* Реакции под сообщением, по центру. Tap → число; tap по другой → меняет свою; Long press → список (Popover по +) */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        {reactions.map((r) => {
          const isActive = hasUserReaction(r);
          return (
            <motion.button
              key={r.emoji}
              type="button"
              onClick={() => onReaction(r.emoji, !isActive)}
              whileTap={{ scale: 1.15 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className={cn(
                'relative inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-sm transition-colors',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'hover:bg-muted'
              )}
              aria-label={`${r.emoji} ${r.count}`}
            >
              <span>{r.emoji}</span>
              {r.count > 0 && (
                <span className="text-[10px] font-medium min-w-[1rem] text-right">
                  {r.count > 99 ? '99+' : r.count}
                </span>
              )}
            </motion.button>
          );
        })}
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Добавить реакцию"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-auto p-2 flex gap-1 rounded-xl" align="center">
            {DEFAULT_REACTIONS.map((emoji) => (
              <motion.button
                key={emoji}
                type="button"
                className="text-lg p-1.5 rounded-lg hover:bg-muted transition-colors"
                onClick={() => {
                  onReaction(emoji, true);
                  setPickerOpen(false);
                }}
                whileTap={{ scale: 1.1 }}
                aria-label={emoji}
              >
                {emoji}
              </motion.button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Просмотры и кнопка комментариев */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {views > 0 && (
          <span className="flex items-center gap-1 text-xs text-[#A9A9A9]">
            <Eye className="h-3.5 w-3.5" aria-hidden />
            {formatViews(views)} просмотров
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-auto py-0.5 px-1 text-xs text-muted-foreground hover:text-foreground gap-1"
          onClick={onOpenComments}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Комментарии {commentCount > 0 ? `(${commentCount})` : ''}
        </Button>
      </div>
    </div>
  );
}

export { DEFAULT_REACTIONS };
