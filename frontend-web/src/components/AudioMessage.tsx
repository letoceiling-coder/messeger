import { useState, useRef, useEffect } from 'react';

interface AudioMessageProps {
  src: string;
  duration?: number;
  isOwn?: boolean;
  uploading?: boolean;
}

// Глобальная переменная для хранения текущего играющего аудио
let currentPlayingAudio: HTMLAudioElement | null = null;

// Экспортируем функцию для остановки текущего аудио извне
export const pauseCurrentAudio = () => {
  if (currentPlayingAudio) {
    currentPlayingAudio.pause();
    currentPlayingAudio = null;
  }
};

export const AudioMessage = ({ src, duration, isOwn = false, uploading = false }: AudioMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Останавливаем аудио при любом действии пользователя
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Слушатель на событие паузы извне
    const handlePause = () => {
      if (isPlaying) {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('pause', handlePause);
      // Пауза при размонтировании
      if (audio && isPlaying) {
        audio.pause();
      }
    };
  }, [isPlaying]);

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
      // Останавливаем предыдущее играющее аудио
      if (currentPlayingAudio && currentPlayingAudio !== audio) {
        currentPlayingAudio.pause();
      }
      
      // Запускаем новое
      audio.play();
      setIsPlaying(true);
      currentPlayingAudio = audio;
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
  
  // Цвета как в Telegram: зелёная кнопка и waveform для своих, серая для чужих
  const buttonBg = isOwn ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600';
  const waveInactiveColor = isOwn ? 'rgba(134, 239, 172, 0.6)' : 'rgba(156, 163, 175, 0.6)'; // green-300/gray-400
  const waveActiveColor = isOwn ? 'rgba(34, 197, 94, 1)' : 'rgba(75, 85, 99, 1)'; // green-500/gray-600
  const textColor = isOwn ? 'text-green-700' : 'text-gray-600';

  // Больше полосок для waveform (как на фото)
  const waveHeights = [
    0.3, 0.5, 0.7, 0.4, 0.8, 0.6, 0.5, 0.9, 0.4, 0.7, 
    0.5, 0.6, 0.8, 0.4, 0.7, 0.5, 0.9, 0.6, 0.4, 0.8,
    0.5, 0.7, 0.4, 0.6, 0.8, 0.5, 0.7, 0.4, 0.6, 0.5,
    0.7, 0.8, 0.5, 0.6, 0.4, 0.7, 0.5, 0.8, 0.6, 0.4
  ];

  return (
    <div className="flex items-center gap-3 min-w-[320px] max-w-full">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Большая круглая кнопка Play/Pause */}
      <button
        onClick={togglePlayPause}
        disabled={uploading}
        className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${buttonBg} text-white shadow-lg ${uploading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
        aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
      >
        {uploading ? (
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Контейнер: время + waveform */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {/* Время слева */}
        <div className={`text-xs font-medium shrink-0 ${textColor}`}>
          {formatTime(currentTime)}
        </div>

        {/* Waveform */}
        <div
          className="flex-1 h-10 flex items-center gap-[2px] cursor-pointer"
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
                className="flex-1 rounded-full transition-all duration-100"
                style={{
                  height: `${height * 100}%`,
                  backgroundColor: isActive ? waveActiveColor : waveInactiveColor,
                  minWidth: '2px',
                  maxWidth: '4px',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
