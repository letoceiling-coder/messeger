import { Skeleton } from '@/components/ui/skeleton';

const POSTS = 3;

export function FeedPostSkeleton() {
  return (
    <div className="py-4 px-2 space-y-4">
      {Array.from({ length: POSTS }).map((_, i) => (
        <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
          <div className="p-3 flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 min-w-0 space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="p-3 flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-8 w-8 rounded-full ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
