import { useLazyLoad } from '../hooks/useLazyLoad';
import { VideoMessagePlayer } from './VideoMessagePlayer';

interface LazyVideoProps {
  src: string;
  className?: string;
  onFullscreen?: () => void;
  uploading?: boolean;
}

/**
 * Компонент для lazy loading видео
 */
export const LazyVideo = ({ src, className = '', onFullscreen, uploading = false }: LazyVideoProps) => {
  const { ref, isVisible } = useLazyLoad();

  return (
    <div ref={ref} className="relative">
      {isVisible || uploading ? (
        <>
          <VideoMessagePlayer
            src={src}
            className={`${className} ${uploading ? 'opacity-70' : ''}`}
            onFullscreen={onFullscreen}
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg className="w-8 h-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </>
      ) : (
        <div className={`${className} rounded-lg bg-app-surface-hover flex items-center justify-center`} style={{ minHeight: '150px' }}>
          <svg className="w-8 h-8 text-app-text-secondary animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
};
