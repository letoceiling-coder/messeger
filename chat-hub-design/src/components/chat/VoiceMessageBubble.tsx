import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { Message } from '@/types/messenger';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const WAVEFORM_BARS = 48;
const DEFAULT_WAVEFORM = Array.from({ length: WAVEFORM_BARS }, () =>
  Math.random() * 0.6 + 0.2
);

/** Воспроизведение: если есть mediaUrl — реальное аудио, иначе тон (Web Audio API). */
function useVoicePlayback(
  isPlaying: boolean,
  duration: number,
  playbackSpeed: number,
  mediaUrl: string | undefined,
  onPlaybackEnd?: () => void
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Записанное аудио по mediaUrl
  useEffect(() => {
    if (!mediaUrl || !isPlaying) return;
    const audio = new Audio(mediaUrl);
    audioRef.current = audio;
    audio.playbackRate = playbackSpeed;
    audio.play().catch(() => {});
    const onEnded = () => {
      audioRef.current = null;
      onPlaybackEnd?.();
    };
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, [mediaUrl, isPlaying, playbackSpeed, onPlaybackEnd]);

  // Тон, если нет mediaUrl
  useEffect(() => {
    if (mediaUrl || !isPlaying || duration <= 0) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    ctxRef.current = ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 320;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    oscillatorRef.current = osc;

    const lengthSec = duration / playbackSpeed;
    const t = setTimeout(() => {
      try { osc.stop(); } catch { /* already stopped */ }
      oscillatorRef.current = null;
      ctx.close();
      ctxRef.current = null;
    }, lengthSec * 1000);

    return () => {
      clearTimeout(t);
      try { osc.stop(); } catch { /* already stopped */ }
      oscillatorRef.current = null;
      ctx.close();
      ctxRef.current = null;
    };
  }, [mediaUrl, isPlaying, duration, playbackSpeed]);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch { /* already stopped */ }
      oscillatorRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
  };

  return { stop };
}

interface VoiceMessageBubbleProps {
  message: Message;
  formatTime: (date: Date) => string;
  renderStatus?: (message: Message) => React.ReactNode;
  className?: string;
  /** ID активного голосового (воспроизводится); null — ни одно не активно */
  activeVoiceId?: string | null;
  onActivate?: (id: string) => void;
  onDeactivate?: () => void;
}

export default function VoiceMessageBubble({
  message,
  formatTime,
  renderStatus,
  className,
  activeVoiceId = null,
  onActivate,
  onDeactivate,
}: VoiceMessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const isActive = activeVoiceId === message.id;
  const duration = message.duration ?? 0;
  const waveform = useMemo(
    () => (message.waveform && message.waveform.length > 0 ? message.waveform : DEFAULT_WAVEFORM),
    [message.waveform]
  );

  const onPlaybackEnd = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    onDeactivate?.();
  }, [onDeactivate]);
  const { stop: stopPlayback } = useVoicePlayback(
    isPlaying,
    duration,
    playbackSpeed,
    message.mediaUrl,
    onPlaybackEnd
  );

  // Деактивация при клике вне блока (как у видеокружка)
  useEffect(() => {
    if (!isActive) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (bubbleRef.current?.contains(target)) return;
      stopPlayback();
      setProgress(0);
      setIsPlaying(false);
      onDeactivate?.();
    };
    document.addEventListener('mousedown', handleOutside, true);
    document.addEventListener('touchstart', handleOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside, true);
      document.removeEventListener('touchstart', handleOutside, true);
    };
  }, [isActive, onDeactivate, stopPlayback]);

  // Сброс воспроизведения, когда активным стало другое сообщение
  useEffect(() => {
    if (activeVoiceId !== null && activeVoiceId !== message.id && isPlaying) {
      stopPlayback();
      setProgress(0);
      setIsPlaying(false);
    }
  }, [activeVoiceId, message.id, isPlaying, stopPlayback]);

  // Simulate playback progress
  useEffect(() => {
    if (!isPlaying || duration <= 0) return;
    const step = (100 / duration) * (1 / 10) * playbackSpeed;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setIsPlaying(false);
          return 0;
        }
        return Math.min(p + step, 100);
      });
    }, 100);
    return () => clearInterval(id);
  }, [isPlaying, duration, playbackSpeed]);

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
      setProgress(0);
      setIsPlaying(false);
      onDeactivate?.();
    } else {
      onActivate?.(message.id);
      setIsPlaying(true);
    }
  };

  const cycleSpeed = () => {
    setPlaybackSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1));
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentTime = (progress / 100) * duration;

  return (
    <div
      ref={bubbleRef}
      data-voice-message
      className={cn(
        'flex items-center gap-3 min-w-0 max-w-[var(--message-bubble-max-w)] rounded-bubble px-3 py-2 shadow-soft transition-colors',
        message.isOutgoing
          ? 'rounded-bubble-outgoing bg-[hsl(var(--message-outgoing))]'
          : 'rounded-bubble-incoming bg-[hsl(var(--message-incoming))]',
        isActive && 'ring-2 ring-primary/30',
        className
      )}
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={togglePlay}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center"
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" />
        )}
      </motion.button>

      <div className="flex-1 min-w-0 flex flex-col gap-1 max-w-[160px]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-1 min-w-0 flex items-center gap-0.5 h-6 overflow-hidden max-w-[140px]">
            {waveform.slice(0, WAVEFORM_BARS).map((h, i) => {
              const filled = (i / WAVEFORM_BARS) * 100 <= progress;
              return (
                <motion.span
                  key={i}
                  className={cn(
                    'w-1 shrink-0 rounded-full min-h-[4px] transition-colors',
                    filled ? 'bg-primary' : 'bg-muted-foreground/40'
                  )}
                  style={{ height: `${h * 100}%` }}
                  animate={isPlaying ? { opacity: [0.7, 1, 0.7] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">
            {formatDuration(isPlaying ? currentTime : duration)}
          </span>
          <div className="flex items-center gap-1">
            {!message.isOutgoing && message.isPlayed !== false && (
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" title="Прослушано" />
            )}
            {message.isOutgoing && renderStatus?.(message)}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={cycleSpeed}
        className="text-[10px] font-medium text-primary shrink-0 px-1"
      >
        {playbackSpeed}x
      </button>
    </div>
  );
}
