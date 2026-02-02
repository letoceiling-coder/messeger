import { ReactNode, cloneElement, isValidElement } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  /** Один дочерний элемент (скролл-контейнер), на него вешаются touch-обработчики */
  children: ReactNode;
  pullY: number;
  refreshing: boolean;
  progress: number;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  className?: string;
}

export function PullToRefresh({
  children,
  pullY,
  refreshing,
  progress,
  handlers,
  className,
}: PullToRefreshProps) {
  const trigger = progress >= 1;
  const child = isValidElement(children) ? cloneElement(children as React.ReactElement<Record<string, unknown>>, handlers) : children;

  return (
    <div className={cn('flex flex-col min-h-full', className)}>
      <div
        className="flex items-center justify-center shrink-0 transition-opacity duration-150 pointer-events-none text-muted-foreground"
        style={{
          height: Math.max(0, pullY),
          opacity: pullY > 0 ? 1 : 0,
        }}
      >
        <motion.div
          className="flex flex-col items-center gap-1"
          animate={{
            scale: trigger ? 1.1 : 1,
            rotate: refreshing ? 360 : 0,
          }}
          transition={{ rotate: { duration: 0.8, repeat: refreshing ? Infinity : 0 } }}
        >
          <RefreshCw className={cn('h-6 w-6', refreshing && 'animate-spin')} />
          <span className="text-xs">
            {refreshing ? 'Обновление…' : trigger ? 'Отпустите' : 'Потяните вниз'}
          </span>
        </motion.div>
      </div>
      {child}
    </div>
  );
}
