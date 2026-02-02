import { useRef, useState, useCallback } from 'react';
import { Pin } from 'lucide-react';
import { Message } from '@/types/messenger';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Video, Mic, File, Sticker } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const HIGHLIGHT_DURATION_MS = 1000;
const LONG_PRESS_MS = 500;

export interface PinBannerCallbacks {
  onPinnedBarClick: () => void;
  onPinnedIndexChange: (index: number) => void;
  onScrollToPinnedMessage: (messageId: string) => void;
  onPinnedMessageHighlight: (messageId: string) => void;
  onPinnedBarLongPress: () => void;
  onPinnedBarClose: () => void;
}

interface PinBannerProps {
  pinnedMessages: Message[];
  currentPinnedIndex: number;
  /** Скрыть панель (не откреплять). Вызов onPinnedBarClose. */
  onClose: () => void;
  /** Tap по панели: скролл к current, highlight, затем индекс (currentIndex + 1) % length */
  onBarClick: () => void;
  /** Открыть экран «Все закреплённые» */
  onViewAllPinned: () => void;
  /** Открепить текущее сообщение (опционально, если есть права) */
  onUnpinCurrent?: () => void;
  /** Доп. класс для контейнера */
  className?: string;
}

function getPreviewContent(message: Message): React.ReactNode {
  switch (message.type) {
    case 'image':
      return (
        <span className="flex items-center gap-1">
          <ImageIcon className="h-3 w-3 shrink-0" />
          Фото
        </span>
      );
    case 'video':
    case 'video_note':
      return (
        <span className="flex items-center gap-1">
          <Video className="h-3 w-3 shrink-0" />
          {message.type === 'video_note' ? 'Видеозаметка' : 'Видео'}
        </span>
      );
    case 'voice':
      return (
        <span className="flex items-center gap-1">
          <Mic className="h-3 w-3 shrink-0" />
          Голосовое сообщение
        </span>
      );
    case 'file':
      return (
        <span className="flex items-center gap-1">
          <File className="h-3 w-3 shrink-0" />
          {message.fileName || 'Файл'}
        </span>
      );
    case 'sticker':
      return (
        <span className="flex items-center gap-1">
          <Sticker className="h-3 w-3 shrink-0" />
          Стикер
        </span>
      );
    case 'contact':
      return message.contactName || message.content || 'Контакт';
    default:
      return message.content.length > 50
        ? `${message.content.substring(0, 50)}…`
        : message.content;
  }
}

const PinBanner = ({
  pinnedMessages,
  currentPinnedIndex,
  onClose,
  onBarClick,
  onViewAllPinned,
  onUnpinCurrent,
  className,
}: PinBannerProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  if (pinnedMessages.length === 0) return null;

  const safeIndex = Math.min(
    Math.max(0, currentPinnedIndex),
    pinnedMessages.length - 1
  );
  const currentMessage = pinnedMessages[safeIndex];
  const total = pinnedMessages.length;
  const showCounter = total > 1;

  const handlePointerDown = useCallback(() => {
    longPressFiredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      longPressFiredRef.current = true;
      if (typeof navigator.vibrate === 'function') navigator.vibrate(10);
      setMenuOpen(true);
    }, LONG_PRESS_MS);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTap = useCallback(() => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    if (typeof navigator.vibrate === 'function') navigator.vibrate(5);
    onBarClick();
  }, [onBarClick]);

  const handleCloseMenu = useCallback(() => setMenuOpen(false), []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open && !longPressFiredRef.current) {
        setMenuOpen(false);
        return;
      }
      setMenuOpen(open);
    },
    []
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'sticky top-14 z-30 border-b border-border bg-muted/50 px-3 py-2',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 shrink-0 text-primary rotate-45" />

          <DropdownMenu open={menuOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
              <div
                role="button"
                tabIndex={0}
                className="flex-1 min-w-0 cursor-pointer select-none rounded-md active:bg-muted/80 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={handleTap}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerLeave}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenuOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTap();
                  }
                }}
              >
                <div className="flex items-center gap-2 py-0.5">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={`${currentMessage.id}-${safeIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs text-muted-foreground truncate flex-1"
                    >
                      {getPreviewContent(currentMessage)}
                    </motion.p>
                  </AnimatePresence>
                  {showCounter && (
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {safeIndex + 1}/{total}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-xl">
              <DropdownMenuItem
                onSelect={() => {
                  handleCloseMenu();
                  onViewAllPinned();
                }}
                className="cursor-pointer"
              >
                Все закреплённые
              </DropdownMenuItem>
              {onUnpinCurrent && (
                <DropdownMenuItem
                  onSelect={() => {
                    handleCloseMenu();
                    onUnpinCurrent();
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  Открепить текущее
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => {
                  handleCloseMenu();
                  onClose();
                }}
                className="cursor-pointer"
              >
                Закрыть панель
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PinBanner;
export { HIGHLIGHT_DURATION_MS };
