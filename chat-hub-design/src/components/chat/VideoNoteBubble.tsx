import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types/messenger';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const SIZE_COMPACT = 200;
const STROKE_WIDTH = 3;
const R = (SIZE_COMPACT - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

interface VideoNoteBubbleProps {
  message: Message;
  formatTime: (date: Date) => string;
  renderStatus?: (message: Message) => React.ReactNode;
  className?: string;
  /** ID активного видеокружка (развёрнут со звуком); null — ни один не активен */
  activeVideoNoteId: string | null;
  onActivate: (id: string) => void;
  onDeactivate: () => void;
}

export default function VideoNoteBubble({
  message,
  formatTime,
  renderStatus,
  className,
  activeVideoNoteId,
  onActivate,
  onDeactivate,
}: VideoNoteBubbleProps) {
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  const hasVideo = Boolean(message.mediaUrl);
  const isActive = activeVideoNoteId === message.id;

  // При активном кружке: клик вне кружка — деактивировать
  useEffect(() => {
    if (!isActive) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (bubbleRef.current?.contains(target)) return;
      onDeactivate();
    };
    document.addEventListener('mousedown', handleOutsideClick, true);
    document.addEventListener('touchstart', handleOutsideClick, true);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick, true);
      document.removeEventListener('touchstart', handleOutsideClick, true);
    };
  }, [isActive, onDeactivate]);

  // По умолчанию: без звука, зациклено. При активации: со звуком, с начала, без цикла.
  useEffect(() => {
    if (!hasVideo || !videoRef.current) return;
    const video = videoRef.current;
    if (isActive) {
      video.muted = false;
      video.loop = false;
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.muted = true;
      video.loop = true;
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }, [hasVideo, isActive]);

  // Прогресс и деактивация по окончании — только в активном режиме
  useEffect(() => {
    if (!hasVideo || !videoRef.current) return;
    const video = videoRef.current;

    const onTimeUpdate = () => {
      if (!isActive) return;
      if (video.duration && Number.isFinite(video.duration)) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    const onEnded = () => {
      if (isActive) {
        setProgress(0);
        onDeactivate();
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
    };
  }, [hasVideo, isActive, onDeactivate]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasVideo) return;
    if (isActive) {
      // Клик по активному кружку — только пауза/воспроизведение, без деактивации
      const video = videoRef.current;
      if (video) {
        if (video.paused) video.play();
        else video.pause();
      }
    } else {
      onActivate(message.id);
    }
  };

  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('flex flex-col items-end gap-1', message.isOutgoing ? 'items-end' : 'items-start', className)}
    >
      <motion.div
        ref={bubbleRef}
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'rounded-full overflow-hidden bg-muted flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          isActive ? 'w-[min(75vw,400px)] h-[min(75vw,400px)] shadow-lg' : 'w-[200px] h-[200px]'
        )}
      >
        <button
          type="button"
          onClick={handleClick}
          className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center"
          aria-label={isActive ? 'Пауза / воспроизведение' : 'Развернуть видеокружок'}
        >
          {message.mediaUrl ? (
            <video
              ref={videoRef}
              src={message.mediaUrl}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              loop
              autoPlay
              preload="auto"
            />
          ) : message.thumbnailUrl ? (
            <img
              src={message.thumbnailUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10" />
          )}
          {/* Кольцо прогресса — масштабируется с контейнером через viewBox */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            viewBox={`0 0 ${SIZE_COMPACT} ${SIZE_COMPACT}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <circle
              cx={SIZE_COMPACT / 2}
              cy={SIZE_COMPACT / 2}
              r={R}
              fill="none"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth={STROKE_WIDTH}
            />
            {isActive && (
              <motion.circle
                cx={SIZE_COMPACT / 2}
                cy={SIZE_COMPACT / 2}
                r={R}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transition={{ duration: 0.1 }}
              />
            )}
          </svg>
        </button>
      </motion.div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground">
          {formatTime(message.timestamp)}
        </span>
        {message.isOutgoing && renderStatus?.(message)}
      </div>
    </motion.div>
  );
}
