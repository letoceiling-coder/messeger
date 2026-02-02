import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChats } from '@/context/ChatsContext';
import { useMessages } from '@/context/MessagesContext';
import type { FeedStory, FeedUser } from '@/types/feed';

const CURRENT_USER_ID = 'user-1';

interface ReplyToStorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  story: FeedStory | null;
  author: FeedUser | undefined;
}

/** Шторка ответа на историю: отправка сообщения автору истории. */
const ReplyToStorySheet = ({
  open,
  onOpenChange,
  story,
  author,
}: ReplyToStorySheetProps) => {
  const navigate = useNavigate();
  const { chats, addChat } = useChats();
  const { addMessageToChat } = useMessages();
  const [replyText, setReplyText] = useState('');

  const handleSend = () => {
    const text = replyText.trim();
    if (!text || !story || !author) return;

    let chat = chats.find(
      (c) =>
        !c.isGroup &&
        !c.isChannel &&
        !c.isBot &&
        c.members?.includes(story.authorId)
    );

    if (!chat) {
      const newChatId = `chat-story-reply-${Date.now()}`;
      chat = {
        id: newChatId,
        name: author.name,
        username: author.username,
        avatar: author.avatar,
        isGroup: false,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        members: [CURRENT_USER_ID, story.authorId],
      };
      addChat(chat);
    }

    addMessageToChat(chat.id, {
      id: `msg-story-reply-${Date.now()}`,
      chatId: chat.id,
      senderId: CURRENT_USER_ID,
      type: 'text',
      content: text,
      timestamp: new Date(),
      status: 'sent',
      isOutgoing: true,
    });

    setReplyText('');
    onOpenChange(false);
    navigate(`/chat/${chat.id}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[50vh]">
        <SheetHeader>
          <SheetTitle>
            Ответить {author?.name ?? story?.authorId ?? 'автору'}
          </SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-3">
          <Input
            placeholder="Ваше сообщение..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="rounded-xl"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSend} disabled={!replyText.trim()}>
              Отправить
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReplyToStorySheet;
