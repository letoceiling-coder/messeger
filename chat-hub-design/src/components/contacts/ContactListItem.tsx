import { useRef } from 'react';
import { Pin, VolumeX, Volume2, Archive, ArchiveRestore, Trash2, Ban, MessageCircle } from 'lucide-react';
import { Contact } from '@/types/messenger';
import UserAvatar from '@/components/common/Avatar';
import { formatLastSeen } from '@/data/mockData';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface ContactListItemProps {
  contact: Contact;
  onClick: () => void;
  onPin?: (contact: Contact) => void;
  onArchive?: (contact: Contact) => void;
  onMute?: (contact: Contact) => void;
  onBlock?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  onClearHistory?: (contact: Contact) => void;
}

export default function ContactListItem({
  contact,
  onClick,
  onPin,
  onArchive,
  onMute,
  onBlock,
  onDelete,
  onClearHistory,
}: ContactListItemProps) {
  const touchStartX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const delta = endX - touchStartX.current;
    if (delta > 80 && onPin) onPin(contact);
    if (delta < -80 && onArchive) onArchive(contact);
  };

  const statusText = contact.isTyping
    ? 'печатает...'
    : contact.isOnline
      ? 'онлайн'
      : contact.lastSeen
        ? formatLastSeen(contact.lastSeen)
        : contact.username
          ? `@${contact.username}`
          : '';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          whileTap={{ backgroundColor: 'hsl(var(--secondary))' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={onClick}
          className={cn(
            'flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-secondary',
            contact.isPinned && 'bg-secondary/50'
          )}
        >
          <UserAvatar
            name={contact.name}
            size="lg"
            isOnline={contact.isOnline}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{contact.name}</p>
            <p className="text-sm text-muted-foreground truncate">
              {contact.isTyping ? (
                <span className="text-primary">{statusText}</span>
              ) : contact.isOnline ? (
                <span className="text-[hsl(var(--online-green))]">{statusText}</span>
              ) : (
                statusText
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {contact.isMuted && (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
            {contact.isPinned && (
              <Pin className="h-4 w-4 text-muted-foreground rotate-45" />
            )}
          </div>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent
        className="w-56 rounded-xl shadow-modal border bg-popover"
      >
        <ContextMenuItem onSelect={() => onClick()} className="cursor-pointer">
          <MessageCircle className="mr-2 h-4 w-4" />
          Написать
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => onPin?.(contact)}
          className="cursor-pointer"
        >
          {contact.isPinned ? (
            <>
              <ArchiveRestore className="mr-2 h-4 w-4" />
              Открепить
            </>
          ) : (
            <>
              <Pin className="mr-2 h-4 w-4" />
              Закрепить
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => onMute?.(contact)}
          className="cursor-pointer"
        >
          {contact.isMuted ? (
            <>
              <Volume2 className="mr-2 h-4 w-4" />
              Включить уведомления
            </>
          ) : (
            <>
              <VolumeX className="mr-2 h-4 w-4" />
              Отключить уведомления
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => onClearHistory?.(contact)}
          className="cursor-pointer"
        >
          Очистить историю
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => onBlock?.(contact)}
          className="cursor-pointer"
        >
          <Ban className="mr-2 h-4 w-4" />
          {contact.isBlocked ? 'Разблокировать' : 'Заблокировать'}
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => onDelete?.(contact)}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Удалить контакт
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
