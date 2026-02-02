import { Star, Download, Forward, Trash2 } from 'lucide-react';
import { Message } from '@/types/messenger';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useStickers } from '@/context/StickerContext';

interface StickerBubbleProps {
  message: Message;
  formatTime: (date: Date) => string;
  renderStatus?: (message: Message) => React.ReactNode;
  onDelete?: () => void;
  className?: string;
}

export default function StickerBubble({
  message,
  formatTime,
  renderStatus,
  onDelete,
  className,
}: StickerBubbleProps) {
  const { addToFavorites, removeFromFavorites, isFavorite } = useStickers();
  const isFav = message.stickerId ? isFavorite(message.stickerId) : false;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'flex flex-col items-end gap-0.5',
            message.isOutgoing ? 'items-end' : 'items-start',
            className
          )}
        >
          <div
            className={cn(
              'rounded-2xl overflow-hidden shadow-soft flex items-center justify-center',
              'bg-transparent min-w-[120px] min-h-[120px] max-w-[180px] max-h-[180px]'
            )}
          >
            {message.mediaUrl ? (
              <img
                src={message.mediaUrl}
                alt={message.content}
                className="w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
            ) : (
              <span className="text-4xl">{message.content}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[10px] text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
            {message.isOutgoing && renderStatus?.(message)}
          </div>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent
        className="w-56 rounded-xl shadow-modal border bg-popover"
      >
        <ContextMenuItem
          onSelect={() => {
            if (message.stickerId) {
              if (isFav) removeFromFavorites(message.stickerId);
              else addToFavorites(message.stickerId);
            }
          }}
          className="cursor-pointer"
        >
          <Star className="mr-2 h-4 w-4" />
          {isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => {}} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Сохранить
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => {}} className="cursor-pointer">
          <Forward className="mr-2 h-4 w-4" />
          Переслать
        </ContextMenuItem>
        {message.isOutgoing && onDelete && (
          <ContextMenuItem
            onSelect={() => onDelete()}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
