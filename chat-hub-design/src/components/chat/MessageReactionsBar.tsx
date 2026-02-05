import type { Message, MessageReaction } from '@/types/messenger';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';
import { motion } from 'framer-motion';

const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

interface MessageReactionsBarProps {
  message: Message;
  isOutgoing: boolean;
  onReaction: (emoji: string, add: boolean) => void;
  currentUserId?: string;
}

export default function MessageReactionsBar({
  message,
  isOutgoing,
  onReaction,
  currentUserId = '',
}: MessageReactionsBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const reactions = message.reactions ?? [];
  const hasUserReaction = (r: MessageReaction) => r.userIds?.includes(currentUserId) ?? false;

  if (reactions.length === 0 && !pickerOpen) {
    return (
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-5 w-5 p-0 rounded-full text-muted-foreground hover:text-foreground mt-0.5',
              isOutgoing ? 'self-end' : 'self-start'
            )}
            aria-label="Добавить реакцию"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side={isOutgoing ? 'left' : 'right'} className="w-auto p-2 flex gap-1 rounded-xl" align="end">
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
    );
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-0.5 mt-1',
        isOutgoing ? 'justify-end' : 'justify-start'
      )}
    >
      {reactions.map((r) => {
        const isActive = hasUserReaction(r);
        return (
          <motion.button
            key={r.emoji}
            type="button"
            onClick={() => onReaction(r.emoji, !isActive)}
            whileTap={{ scale: 1.1 }}
            className={cn(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors',
              isActive ? 'bg-primary/15 text-primary' : 'hover:bg-muted'
            )}
            aria-label={`${r.emoji} ${r.count}`}
          >
            <span>{r.emoji}</span>
            {r.count > 1 && <span className="text-[10px] font-medium">{r.count}</span>}
          </motion.button>
        );
      })}
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Добавить реакцию"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side={isOutgoing ? 'left' : 'right'} className="w-auto p-2 flex gap-1 rounded-xl" align="end">
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
  );
}
