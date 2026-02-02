import { useRef, useState, useCallback, useEffect } from 'react';
import { Chat } from '@/types/messenger';
import UserAvatar from '@/components/common/Avatar';
import TypingIndicator from '@/components/common/TypingIndicator';
import OnlinePulse from '@/components/common/OnlinePulse';
import { formatMessageTime } from '@/data/mockData';
import {
  Pin,
  PinOff,
  VolumeX,
  Volume2,
  Check,
  CheckCheck,
  Mic,
  Image,
  File,
  Archive,
  ArchiveRestore,
  Trash2,
  Bot,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ACTIONS_WIDTH = 4 * 56; // 4 кнопки по 56px
const SWIPE_THRESHOLD = 60;

interface ChatListItemProps {
  chat: Chat;
  onClick: () => void;
  onLongPress?: () => void;
  onPin?: (chat: Chat) => void;
  onMute?: (chat: Chat) => void;
  onArchive?: (chat: Chat) => void;
  onDelete?: (chat: Chat) => void;
  /** Открыт ли свайп у этого чата (только один ряд открыт) */
  isRevealed?: boolean;
  onRevealChange?: (chatId: string | null) => void;
}

const ChatListItem = ({
  chat,
  onClick,
  onPin,
  onMute,
  onArchive,
  onDelete,
  isRevealed = false,
  onRevealChange,
}: ChatListItemProps) => {
  const [localRevealed, setLocalRevealed] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const dragStartX = useRef(0);
  const isDraggingRef = useRef(false);
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  // touchmove с passive: false, чтобы при свайпе блокировать прокрутку без ошибки в консоли
  useEffect(() => {
    const el = swipeContainerRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current) e.preventDefault();
    };
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, []);

  const revealed =
    onRevealChange && isRevealed !== undefined ? isRevealed : localRevealed;
  const setRevealed = useCallback(
    (value: boolean) => {
      if (onRevealChange) {
        onRevealChange(value ? chat.id : null);
      } else {
        setLocalRevealed(value);
      }
    },
    [chat.id, onRevealChange]
  );

  const getMessagePreview = () => {
    const { lastMessage } = chat;
    if (!lastMessage) return '';

    const prefix = lastMessage.isOutgoing ? 'Вы: ' : '';

    switch (lastMessage.type) {
      case 'voice':
        return (
          <span className="flex items-center gap-1">
            {prefix && <span className="text-muted-foreground">{prefix}</span>}
            <Mic className="h-4 w-4 text-primary" />
            Голосовое сообщение
          </span>
        );
      case 'video_note':
        return (
          <span className="flex items-center gap-1">
            {prefix && <span className="text-muted-foreground">{prefix}</span>}
            <span>Видеокружок</span>
          </span>
        );
      case 'image':
        return (
          <span className="flex items-center gap-1">
            {prefix && <span className="text-muted-foreground">{prefix}</span>}
            <Image className="h-4 w-4 text-primary" />
            Фото
          </span>
        );
      case 'file':
        return (
          <span className="flex items-center gap-1">
            {prefix && <span className="text-muted-foreground">{prefix}</span>}
            <File className="h-4 w-4 text-primary" />
            {lastMessage.fileName || 'Файл'}
          </span>
        );
      default:
        return prefix ? `${prefix}${lastMessage.content}` : lastMessage.content;
    }
  };

  const getMessageStatus = () => {
    const { lastMessage } = chat;
    if (!lastMessage || !lastMessage.isOutgoing) return null;

    switch (lastMessage.status) {
      case 'sent':
        return <Check className="h-4 w-4 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-4 w-4 text-primary" />;
      default:
        return null;
    }
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      const rev =
        onRevealChange && isRevealed !== undefined ? isRevealed : localRevealed;
      dragStartX.current = rev ? -ACTIONS_WIDTH : 0;
      isDraggingRef.current = true;
      setIsDragging(true);
      setDragX(dragStartX.current);
    },
    [isRevealed, localRevealed, onRevealChange]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const currentX = e.touches[0].clientX;
    // Палец влево: currentX < start → delta отрицательный → nextX отрицательный → контент влево
    const delta = currentX - touchStartX.current;
    const nextX = Math.max(
      -ACTIONS_WIDTH,
      Math.min(0, dragStartX.current + delta)
    );
    setDragX(nextX);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      isDraggingRef.current = false;
      setIsDragging(false);
      const endX = e.changedTouches[0].clientX;
      const delta = endX - touchStartX.current;
      const finalX = Math.max(
        -ACTIONS_WIDTH,
        Math.min(0, dragStartX.current + delta)
      );
      const shouldReveal = finalX < -SWIPE_THRESHOLD;
      setRevealed(shouldReveal);
      setDragX(shouldReveal ? -ACTIONS_WIDTH : 0);
    },
    [setRevealed]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      touchStartX.current = e.clientX;
      const rev =
        onRevealChange && isRevealed !== undefined ? isRevealed : localRevealed;
      dragStartX.current = rev ? -ACTIONS_WIDTH : 0;
      isDraggingRef.current = true;
      setIsDragging(true);
      setDragX(dragStartX.current);
    },
    [isRevealed, localRevealed, onRevealChange]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      const currentX = e.clientX;
      // Палец/мышь влево: currentX < start → delta отрицательный → nextX отрицательный → контент влево
      const delta = currentX - touchStartX.current;
      const nextX = Math.max(
        -ACTIONS_WIDTH,
        Math.min(0, dragStartX.current + delta)
      );
      setDragX(nextX);
    },
    []
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      isDraggingRef.current = false;
      setIsDragging(false);
      const shouldReveal = dragX < -SWIPE_THRESHOLD;
      setRevealed(shouldReveal);
      setDragX(shouldReveal ? -ACTIONS_WIDTH : 0);
    },
    [setRevealed, dragX]
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      setIsDragging(false);
      const shouldReveal = dragX < -SWIPE_THRESHOLD;
      setRevealed(shouldReveal);
      setDragX(shouldReveal ? -ACTIONS_WIDTH : 0);
    },
    [dragX, setRevealed]
  );

  const handleContentClick = useCallback(() => {
    if (revealed) {
      setRevealed(false);
      return;
    }
    onClick();
  }, [revealed, setRevealed, onClick]);

  const actions = [
    {
      key: 'archive',
      icon: chat.isArchived ? ArchiveRestore : Archive,
      label: chat.isArchived ? 'Из архива' : 'В архив',
      onClick: () => {
        onArchive?.(chat);
        setRevealed(false);
      },
      className: 'bg-muted hover:bg-muted/80 text-foreground',
    },
    {
      key: 'delete',
      icon: Trash2,
      label: 'Удалить',
      onClick: () => {
        onDelete?.(chat);
        setRevealed(false);
      },
      className: 'bg-destructive/90 hover:bg-destructive text-destructive-foreground',
    },
    {
      key: 'mute',
      icon: chat.isMuted ? Volume2 : VolumeX,
      label: chat.isMuted ? 'Звук вкл' : 'Звук выкл',
      onClick: () => {
        onMute?.(chat);
        setRevealed(false);
      },
      className: 'bg-muted hover:bg-muted/80 text-foreground',
    },
    {
      key: 'pin',
      icon: chat.isPinned ? PinOff : Pin,
      label: chat.isPinned ? 'Открепить' : 'Закрепить',
      onClick: () => {
        onPin?.(chat);
        setRevealed(false);
      },
      className: 'bg-muted hover:bg-muted/80 text-foreground',
    },
  ];

  const { lastMessage } = chat;

  return (
    <div className="relative overflow-hidden border-b border-border">
      {/* Кнопки действий справа — pointer-events: none когда закрыто, чтобы касания проходили к контенту и свайп работал по всей ширине */}
      <div
        className={cn(
          'absolute top-0 right-0 bottom-0 flex items-stretch touch-none',
          !revealed && 'pointer-events-none'
        )}
        style={{ width: ACTIONS_WIDTH }}
      >
        <AnimatePresence>
          {revealed &&
            actions.map((action, i) => (
              <motion.button
                key={action.key}
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                  delay: i * 0.04,
                }}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0 px-1',
                  'touch-manipulation active:opacity-80',
                  action.className
                )}
                onClick={action.onClick}
                aria-label={action.label}
              >
                <action.icon className="h-5 w-5 shrink-0" />
                <span className="text-[10px] font-medium truncate w-full text-center">
                  {action.label}
                </span>
              </motion.button>
            ))}
        </AnimatePresence>
      </div>

      {/* Контент чата — плавно смещается влево при свайпе влево; по всей ширине принимает касания */}
      <motion.div
        ref={swipeContainerRef}
        className="flex items-center min-w-full touch-pan-y"
        animate={{ x: isDragging ? dragX : revealed ? -ACTIONS_WIDTH : 0 }}
        transition={isDragging ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 40 }}
        style={{ willChange: isDragging || revealed ? 'transform' : 'auto' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        <motion.div
          role="button"
          tabIndex={0}
          className={cn(
            'flex items-center gap-3 px-4 py-3 cursor-pointer transition-all touch-pan-y',
            'bg-background active:bg-secondary flex-1 min-w-0',
            chat.isPinned && 'bg-gradient-to-r from-primary/5 to-transparent border-l-2 border-l-primary/40'
          )}
          onClick={handleContentClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleContentClick();
            }
          }}
          whileTap={{ backgroundColor: 'hsl(var(--secondary))' }}
          style={{
            boxShadow: chat.isPinned ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
          }}
        >
          {/* Avatar with online pulse */}
          <div className="relative">
            <UserAvatar
              name={chat.name}
              size="lg"
              isOnline={!chat.isGroup && !chat.isBot && !chat.isChannel && chat.isOnline}
            />
            {chat.isBot && (
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <Bot className="h-3 w-3 text-primary-foreground" />
              </span>
            )}
            {chat.isChannel && (
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center border-2 border-background">
                <Megaphone className="h-3 w-3 text-white" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  'font-medium truncate flex items-center gap-1.5',
                  chat.unreadCount > 0 && 'font-semibold'
                )}
              >
                {chat.name}
              </span>

              <div className="flex items-center gap-1 shrink-0">
                {getMessageStatus()}
                <span
                  className={cn(
                    'text-xs',
                    chat.unreadCount > 0 ? 'text-primary font-medium' : 'text-muted-foreground'
                  )}
                >
                  {lastMessage ? formatMessageTime(lastMessage.timestamp) : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p
                className={cn(
                  'text-sm truncate',
                  chat.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {chat.isTyping ? (
                  <TypingIndicator size="sm" />
                ) : (
                  getMessagePreview()
                )}
              </p>

              <div className="flex items-center gap-1.5 shrink-0">
                {chat.isMuted && (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                {chat.isPinned && (
                  <Pin className="h-4 w-4 text-primary/60 rotate-45" />
                )}
                {chat.unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'min-w-[20px] h-5 px-1.5 flex items-center justify-center',
                      'rounded-full text-xs font-medium shadow-sm',
                      chat.isMuted
                        ? 'bg-muted-foreground text-background'
                        : 'bg-primary text-primary-foreground'
                    )}
                  >
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </motion.span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ChatListItem;
