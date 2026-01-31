import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  /** Callback при достижении верха списка */
  onLoadMore: () => void;
  /** Есть ли ещё данные для загрузки */
  hasMore: boolean;
  /** Идёт ли загрузка */
  loading: boolean;
  /** Порог для триггера загрузки (px от верха) */
  threshold?: number;
}

/**
 * Hook для infinite scroll вверх (загрузка старых сообщений)
 */
export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  loading,
  threshold = 100,
}: UseInfiniteScrollOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);

  /**
   * Восстанавливает позицию скролла после загрузки новых сообщений сверху
   */
  const restoreScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container || previousScrollHeight.current === 0) return;

    // Разница в высоте = высота новых сообщений
    const newScrollHeight = container.scrollHeight;
    const heightDifference = newScrollHeight - previousScrollHeight.current;

    if (heightDifference > 0) {
      container.scrollTop = heightDifference;
    }

    previousScrollHeight.current = 0;
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || loading || !hasMore) return;

    // Проверяем достижение верха
    if (container.scrollTop <= threshold) {
      // Сохраняем текущую высоту для восстановления позиции
      previousScrollHeight.current = container.scrollHeight;
      onLoadMore();
    }
  }, [loading, hasMore, threshold, onLoadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return { containerRef, restoreScrollPosition };
};
