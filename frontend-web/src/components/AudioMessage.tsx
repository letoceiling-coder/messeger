import { useState, useRef, useEffect } from 'react';

interface AudioMessageProps {
  src: string;
  duration?: number;
  isOwn?: boolean;
  uploading?: boolean;
}

export const AudioMessage = ({ src, duration, isOwn = false, uploading = false }: AudioMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlayPause = () => {
    if (uploading) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (uploading) return;
    const audio = audioRef.current;
    if (!audio || !audioDuration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * audioDuration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;
  const buttonColor = isOwn ? 'text-white hover:bg-white/20' : 'text-app-accent hover:bg-app-accent/10';
  const waveColor = isOwn ? 'rgba(255, 255, 255, 0.5)' : 'rgba(10, 132, 255, 0.5)';
  const waveActiveColor = isOwn ? 'rgba(255, 255, 255, 1)' : 'rgba(10, 132, 255, 1)';

  // Генерация случайных высот для waveform (имитация)
  const waveHeights = [0.4, 0.7, 0.3, 0.8, 0.5, 0.9, 0.4, 0.6, 0.7, 0.5, 0.8, 0.3, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8, 0.6, 0.4];

  return (
    <div className="flex items-center gap-2 min-w-[280px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Кнопка play/pause */}
      <button
        onClick={togglePlayPause}
        disabled={uploading}
        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${buttonColor} ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
      >
        {uploading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Waveform с прогрессом */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div
          className="h-8 flex items-center gap-0.5 cursor-pointer"
          onClick={handleSeek}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {waveHeights.map((height, i) => {
            const barProgress = (i / waveHeights.length) * 100;
            const isActive = barProgress <= progress;
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all"
                style={{
                  height: `${height * 100}%`,
                  backgroundColor: isActive ? waveActiveColor : waveColor,
                  minWidth: '2px',
                }}
              />
            );
          })}
        </div>

        {/* Время */}
        <div className={`text-xs ${isOwn ? 'text-white/80' : 'text-app-text-secondary'}`}>
          {formatTime(currentTime)} / {formatTime(audioDuration)}
        </div>
      </div>
    </div>
  );
};
