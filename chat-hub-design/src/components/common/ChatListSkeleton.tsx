import { Skeleton } from '@/components/ui/skeleton';

const LINES = 8;

export function ChatListSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: LINES }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12 shrink-0" />
            </div>
            <Skeleton className="h-3 w-full max-w-[180px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
