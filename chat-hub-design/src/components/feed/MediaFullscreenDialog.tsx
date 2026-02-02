import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { FeedMedia } from '@/types/feed';
import { cn } from '@/lib/utils';

interface MediaFullscreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: FeedMedia[];
  initialIndex?: number;
}

/** Полноэкранный просмотр медиа поста (lightbox) с переключением карусели. */
const MediaFullscreenDialog = ({
  open,
  onOpenChange,
  media,
  initialIndex = 0,
}: MediaFullscreenDialogProps) => {
  const [index, setIndex] = useState(initialIndex);
  useEffect(() => {
    if (open) setIndex(Math.min(initialIndex, media.length - 1));
  }, [open, initialIndex, media.length]);
  const current = media[index];
  const hasMultiple = media.length > 1;

  const goPrev = () => setIndex((i) => (i <= 0 ? media.length - 1 : i - 1));
  const goNext = () => setIndex((i) => (i >= media.length - 1 ? 0 : i + 1));

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'inset-0 w-full h-full max-w-none max-h-none translate-x-0 translate-y-0 rounded-none border-0 p-0 gap-0 bg-black [&>button]:hidden'
        )}
      >
        <DialogTitle className="sr-only">Просмотр медиа</DialogTitle>

        <div className="absolute top-0 right-0 z-10 p-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            aria-label="Закрыть"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex h-full items-center justify-center relative">
          {hasMultiple && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
              aria-label="Назад"
              onClick={goPrev}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {current.type === 'image' ? (
            <img
              src={current.url}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={current.url}
              controls
              playsInline
              className="max-w-full max-h-full object-contain"
            />
          )}

          {hasMultiple && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
              aria-label="Вперёд"
              onClick={goNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {hasMultiple && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
              {media.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    i === index ? 'bg-white' : 'bg-white/50'
                  )}
                  aria-hidden
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaFullscreenDialog;
