import { useCallback, useRef, useState } from 'react';

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;
const RESISTANCE = 0.4;

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
}

export function usePullToRefresh({ onRefresh, enabled = true }: UsePullToRefreshOptions) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      startY.current = e.touches[0].clientY;
      const target = e.currentTarget;
      scrollTop.current = target.scrollTop ?? 0;
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || refreshing) return;
      const target = e.currentTarget;
      const scrollTopNow = target.scrollTop ?? 0;
      if (scrollTopNow > 0) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      if (diff <= 0) return;

      const resisted = Math.min(diff * RESISTANCE, MAX_PULL);
      setPullY(resisted);
    },
    [enabled, refreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!enabled) return;
    if (pullY >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(0);
      try {
        await Promise.resolve(onRefresh());
      } finally {
        setRefreshing(false);
      }
    } else {
      setPullY(0);
    }
  }, [enabled, onRefresh, pullY, refreshing]);

  const isPulling = pullY > 0;
  const progress = Math.min(pullY / PULL_THRESHOLD, 1);
  const triggerRefresh = pullY >= PULL_THRESHOLD;

  return {
    pullY,
    refreshing,
    isPulling,
    progress,
    triggerRefresh,
    handlers: { onTouchStart: handleTouchStart, onTouchMove: handleTouchMove, onTouchEnd: handleTouchEnd },
  };
}
