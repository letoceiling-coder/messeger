export const ChatListSkeleton = () => {
  return (
    <div className="divide-y divide-app-border animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          {/* Аватар */}
          <div className="w-12 h-12 rounded-full bg-app-surface shrink-0" />
          
          {/* Контент */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Имя */}
            <div className="h-4 bg-app-surface rounded w-1/3" />
            {/* Статус */}
            <div className="h-3 bg-app-surface rounded w-1/4" />
          </div>
          
          {/* Стрелка */}
          <div className="w-4 h-4 bg-app-surface rounded shrink-0" />
        </div>
      ))}
    </div>
  );
};
