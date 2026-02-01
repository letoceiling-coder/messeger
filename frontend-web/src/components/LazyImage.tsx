import { useState } from 'react';
import { useLazyLoad } from '../hooks/useLazyLoad';

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  uploading?: boolean;
}

/**
 * Компонент для lazy loading изображений с обработкой 404
 */
export const LazyImage = ({ src, alt = '', className = '', onClick, uploading = false }: LazyImageProps) => {
  const { ref, isVisible } = useLazyLoad();
  const [loadError, setLoadError] = useState(false);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {isVisible || uploading ? (
        <>
          {!loadError ? (
            <>
              <img
                src={src}
                alt={alt}
                className={`max-w-full max-h-64 rounded-lg object-cover cursor-pointer ${uploading ? 'opacity-70' : ''}`}
                onClick={onClick}
                onError={() => {
                  console.warn('Image load error:', src);
                  setLoadError(true);
                }}
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
            </>
          ) : (
            <div className="max-w-full max-h-64 rounded-lg bg-red-500/10 border border-red-500/30 flex flex-col items-center justify-center p-6 text-center" style={{ minHeight: '100px' }}>
              <svg className="w-10 h-10 text-red-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-red-400">Изображение недоступно</p>
            </div>
          )}
        </>
      ) : (
        <div className="max-w-full max-h-64 rounded-lg bg-app-surface-hover flex items-center justify-center" style={{ minHeight: '100px' }}>
          <svg className="w-8 h-8 text-app-text-secondary animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
};
