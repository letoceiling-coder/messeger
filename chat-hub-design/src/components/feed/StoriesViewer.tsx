import { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/common/Avatar';
import ShareStorySheet from '@/components/feed/ShareStorySheet';
import ReplyToStorySheet from '@/components/feed/ReplyToStorySheet';
import type { FeedStory, FeedUser } from '@/types/feed';
import { cn } from '@/lib/utils';

interface StoriesViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  story: FeedStory | null;
  author: FeedUser | undefined;
  onNext?: () => void;
  onPrev?: () => void;
}

/** Модальный просмотр истории: медиа, ответить, поделиться в чат. См. FEED_IMPLEMENTATION_PLAN п. 5 */
const StoriesViewer = ({
  open,
  onOpenChange,
  story,
  author,
  onNext,
  onPrev,
}: StoriesViewerProps) => {
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [replySheetOpen, setReplySheetOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = story?.media.type === 'video';

  useEffect(() => {
    if (open && isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Браузер заблокировал автовоспроизведение со звуком
      });
    }
    if (!open && videoRef.current) {
      videoRef.current.pause();
    }
  }, [open, isVideo, story?.id]);

  if (!story) return null;

  const authorName = author?.name ?? story.authorId;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && onNext) onNext();
      else if (diff < 0 && onPrev) onPrev();
    }
    setTouchStart(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'inset-0 w-full h-full max-w-none max-h-none translate-x-0 translate-y-0 rounded-none border-0 p-0 gap-0',
          'bg-black/95 flex flex-col [&>button]:hidden'
        )}
      >
        <DialogTitle className="sr-only">
          История от {authorName}
        </DialogTitle>

        {/* Шапка: аватар, имя, закрыть */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pt-safe bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={authorName}
              size="sm"
              src={author?.avatar}
              className="ring-2 ring-white/50"
            />
            <span className="text-sm font-medium text-white">
              {authorName}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            aria-label="Закрыть"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Медиа по центру */}
        <div
          className="flex-1 flex items-center justify-center min-h-0 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isVideo ? (
            <video
              ref={videoRef}
              src={story.media.url}
              className="max-w-full max-h-full object-contain"
              autoPlay
              loop
              playsInline
            />
          ) : (
            <img
              src={story.media.url}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {/* Нижняя панель: ответить, поделиться */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-6 p-4 pb-safe bg-gradient-to-t from-black/60 to-transparent">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 gap-2"
            onClick={() => setReplySheetOpen(true)}
          >
            <MessageCircle className="h-5 w-5" />
            Ответить
          </Button>
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 gap-2"
            onClick={() => setShareSheetOpen(true)}
          >
            <Share2 className="h-5 w-5" />
            Поделиться
          </Button>
        </div>
      </DialogContent>
      <ShareStorySheet
        open={shareSheetOpen}
        onOpenChange={setShareSheetOpen}
        story={story}
        author={author}
      />
      <ReplyToStorySheet
        open={replySheetOpen}
        onOpenChange={setReplySheetOpen}
        story={story}
        author={author}
      />
    </Dialog>
  );
};

export default StoriesViewer;
