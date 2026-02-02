import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
  size?: 'sm' | 'md';
}

/** Анимированный индикатор «печатает...» с тремя точками */
export default function TypingIndicator({ className, size = 'md' }: TypingIndicatorProps) {
  const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span
      className={cn('text-primary inline-flex items-center gap-1', textSize, className)}
      aria-label="Печатает"
    >
      печатает
      <span className="inline-flex gap-0.5" aria-hidden>
        <span
          className={cn('rounded-full bg-primary animate-bounce', dotSize)}
          style={{ animationDelay: '0ms' }}
        />
        <span
          className={cn('rounded-full bg-primary animate-bounce', dotSize)}
          style={{ animationDelay: '150ms' }}
        />
        <span
          className={cn('rounded-full bg-primary animate-bounce', dotSize)}
          style={{ animationDelay: '300ms' }}
        />
      </span>
    </span>
  );
}
