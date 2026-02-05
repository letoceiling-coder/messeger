import { Skeleton } from '@/components/ui/skeleton';

const BUBBLES = [
  { align: 'start' as const, w: 'w-48', h: 'h-12', rounded: 'rounded-2xl rounded-tl-sm' },
  { align: 'end' as const, w: 'w-56', h: 'h-14', rounded: 'rounded-2xl rounded-tr-sm' },
  { align: 'start' as const, w: 'w-40', h: 'h-10', rounded: 'rounded-2xl rounded-tl-sm' },
  { align: 'end' as const, w: 'w-64', h: 'h-16', rounded: 'rounded-2xl rounded-tr-sm' },
  { align: 'start' as const, w: 'w-52', h: 'h-12', rounded: 'rounded-2xl rounded-tl-sm' },
  { align: 'end' as const, w: 'w-44', h: 'h-10', rounded: 'rounded-2xl rounded-tr-sm' },
  { align: 'start' as const, w: 'w-36', h: 'h-14', rounded: 'rounded-2xl rounded-tl-sm' },
];

export function MessageListSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex justify-center my-4">
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className={b.align === 'end' ? 'flex justify-end' : 'flex justify-start'}
        >
          <div className="flex items-end gap-2 max-w-[85%]">
            {b.align === 'start' && (
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            )}
            <Skeleton className={[b.rounded, b.w, b.h].join(' ')} />
          </div>
        </div>
      ))}
    </div>
  );
}
