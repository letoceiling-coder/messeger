import { cn } from '@/lib/utils';

interface OnlinePulseProps {
  className?: string;
  /** Размер: sm — в списке чатов, md — в header */
  size?: 'sm' | 'md';
}

/** Пульсирующий зелёный индикатор «онлайн» */
export default function OnlinePulse({ className, size = 'sm' }: OnlinePulseProps) {
  const ring = size === 'sm' ? 'w-2.5 h-2.5 border-[1.5px]' : 'w-3 h-3 border-2';
  const ping = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  return (
    <span
      className={cn(
        'absolute bottom-0 right-0 bg-green-500 rounded-full border-2 border-background',
        ring,
        className
      )}
      aria-hidden
    >
      <span
        className={cn('absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75', ping)}
      />
    </span>
  );
}
