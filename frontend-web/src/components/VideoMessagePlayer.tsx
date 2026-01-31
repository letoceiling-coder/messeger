import { useRef, useState, useEffect } from 'react';

interface VideoMessagePlayerProps {
  src: string;
  className?: string;
  onFullscreen?: () => void;
  onClick?: (e: React.MouseEvent) => void;
}

const MENU_MAX_H = 280;

export const VideoMessagePlayer = ({ src, className = '', onFullscreen, onClick }: VideoMessagePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const getMenuPosition = (): { top: number; left: number } | null => {
    const anchor = anchorRef.current;
    if (!anchor) return null;
    const rect = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < MENU_MAX_H && spaceAbove >= spaceBelow;
    const left = Math.min(Math.max(rect.left, 8), window.innerWidth - 200);
    const top = openUp ? Math.max(8, rect.top - MENU_MAX_H) : Math.min(rect.bottom, window.innerHeight - MENU_MAX_H - 8);
    return { top, left };
  };

  useEffect(() => {
    if (!menuOpen) return;
    const pos = getMenuPosition();
    if (pos) setMenuPosition(pos);
    const onScroll = () => {
      const p = getMenuPosition();
      if (p) setMenuPosition(p);
    };
    const onResize = () => {
      const p = getMenuPosition();
      if (p) setMenuPosition(p);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  const openMenu = () => {
    const pos = getMenuPosition();
    if (pos) setMenuPosition(pos);
    setMenuOpen(true);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const handleFullscreen = () => {
    setMenuOpen(false);
    if (onFullscreen) onFullscreen();
    else {
      const v = videoRef.current;
      if (v?.requestFullscreen) v.requestFullscreen();
    }
  };

  const handleDownload = () => {
    setMenuOpen(false);
    const a = document.createElement('a');
    a.href = src;
    a.download = src.split('/').pop() || 'video.mp4';
    a.click();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (v) v.muted = !v.muted;
    setMenuOpen(false);
  };

  const setPlaybackRate = (rate: number) => {
    const v = videoRef.current;
    if (v) v.playbackRate = rate;
    setMenuOpen(false);
  };

  const handlePiP = async () => {
    setMenuOpen(false);
    const v = videoRef.current;
    if (!v || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {
      // ignore
    }
  };

  if (loadError) {
    return (
      <div className={`relative rounded-lg overflow-hidden bg-red-500/10 border border-red-500/30 flex flex-col items-center justify-center p-6 text-center ${className}`} style={{ minHeight: '150px' }}>
        <svg className="w-10 h-10 text-red-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-xs text-red-400">Видео недоступно</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden bg-black ${className}`} onClick={onClick}>
      <video
        ref={videoRef}
        src={src}
        playsInline
        className="max-w-full max-h-64 w-full block"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={(e) => {
          console.warn('Video load error:', src, e);
          setLoadError(true);
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-1 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
        <button
          type="button"
          className="p-1.5 rounded-full text-white/90 hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          aria-label={playing ? 'Пауза' : 'Воспроизведение'}
        >
          {playing ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button
          ref={anchorRef}
          type="button"
          className="p-1.5 rounded-full text-white/90 hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            openMenu();
          }}
          aria-label="Настройки"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="fixed z-50 min-w-[180px] py-1 rounded-xl bg-[#2d2d2f] border border-white/10 shadow-xl max-h-[200px] overflow-y-auto"
            style={{
              left: menuPosition?.left ?? 0,
              top: menuPosition?.top ?? 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
              onClick={handleFullscreen}
            >
              Полноэкранный режим
            </button>
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
              onClick={handleDownload}
            >
              Скачать
            </button>
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
              onClick={toggleMute}
            >
              Отключить звук
            </button>
            <div className="border-t border-white/10 my-1" />
            <div className="px-4 py-1 text-xs text-[#86868a]">Скорость воспроизведения</div>
            {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10"
                onClick={() => setPlaybackRate(rate)}
              >
                {rate === 1 ? 'Обычная' : `${rate}×`}
              </button>
            ))}
            {document.pictureInPictureEnabled && (
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
                onClick={handlePiP}
              >
                Картинка в картинке
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
