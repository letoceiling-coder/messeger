import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useChats } from '@/context/ChatsContext';
import { useMessages } from '@/context/MessagesContext';
import UserAvatar from '@/components/common/Avatar';
import type { FeedStory, FeedUser } from '@/types/feed';
import { cn } from '@/lib/utils';

const CURRENT_USER_ID = 'user-1';

interface ShareStorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  story: FeedStory | null;
  author: FeedUser | undefined;
  onShared?: () => void;
}

/** Шторка выбора чата для отправки ссылки на историю. */
const ShareStorySheet = ({
  open,
  onOpenChange,
  story,
  author,
  onShared,
}: ShareStorySheetProps) => {
  const { chats } = useChats();
  const { addMessageToChat } = useMessages();

  const handleSelectChat = (chatId: string) => {
    if (!story) return;
    const authorName = author?.name ?? story.authorId;
    const content = `📎 История от ${authorName}`;
    addMessageToChat(chatId, {
      id: `msg-story-${Date.now()}`,
      chatId,
      senderId: CURRENT_USER_ID,
      type: 'text',
      content,
      timestamp: new Date(),
      status: 'sent',
      isOutgoing: true,
    });
    onOpenChange(false);
    onShared?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Поделиться историей в чат</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-0">
            {chats.map((chat) => (
              <li key={chat.id}>
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-3 w-full p-3 rounded-xl text-left hover:bg-muted/50 transition-colors'
                  )}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <UserAvatar
                    name={chat.name}
                    size="md"
                    src={chat.avatar}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{chat.name}</p>
                    {chat.isChannel && (
                      <p className="text-xs text-muted-foreground">Канал</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {chats.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Нет чатов для отправки.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShareStorySheet;
