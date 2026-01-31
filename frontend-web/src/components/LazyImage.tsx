import { useLazyLoad } from '../hooks/useLazyLoad';

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  uploading?: boolean;
}

/**
 * Компонент для lazy loading изображений
 */
export const LazyImage = ({ src, alt = '', className = '', onClick, uploading = false }: LazyImageProps) => {
  const { ref, isVisible } = useLazyLoad();

  return (
    <div ref={ref} className={`relative ${className}`}>
      {isVisible || uploading ? (
        <>
          <img
            src={src}
            alt={alt}
            className={`max-w-full max-h-64 rounded-lg object-cover cursor-pointer ${uploading ? 'opacity-70' : ''}`}
            onClick={onClick}
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
        <div className="max-w-full max-h-64 rounded-lg bg-app-surface-hover flex items-center justify-center" style={{ minHeight: '100px' }}>
          <svg className="w-8 h-8 text-app-text-secondary animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
};
