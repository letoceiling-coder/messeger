export const MessagesSkeleton = () => {
  return (
    <div className="space-y-3 px-4 py-4 animate-pulse">
      {/* Левое сообщение (собеседник) */}
      <div className="flex justify-start">
        <div className="max-w-[85%] sm:max-w-md">
          <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-app-surface space-y-2">
            <div className="h-3 bg-app-surface-hover rounded w-48" />
            <div className="h-3 bg-app-surface-hover rounded w-32" />
          </div>
        </div>
      </div>

      {/* Правое сообщение (свое) */}
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-md">
          <div className="px-4 py-3 rounded-2xl rounded-br-md bg-app-accent/20 space-y-2">
            <div className="h-3 bg-app-accent/30 rounded w-40" />
            <div className="h-3 bg-app-accent/30 rounded w-24" />
          </div>
        </div>
      </div>

      {/* Левое сообщение */}
      <div className="flex justify-start">
        <div className="max-w-[85%] sm:max-w-md">
          <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-app-surface">
            <div className="h-3 bg-app-surface-hover rounded w-56" />
          </div>
        </div>
      </div>

      {/* Правое сообщение */}
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-md">
          <div className="px-4 py-3 rounded-2xl rounded-br-md bg-app-accent/20 space-y-2">
            <div className="h-3 bg-app-accent/30 rounded w-44" />
            <div className="h-3 bg-app-accent/30 rounded w-36" />
            <div className="h-3 bg-app-accent/30 rounded w-28" />
          </div>
        </div>
      </div>

      {/* Левое сообщение */}
      <div className="flex justify-start">
        <div className="max-w-[85%] sm:max-w-md">
          <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-app-surface">
            <div className="h-3 bg-app-surface-hover rounded w-52" />
          </div>
        </div>
      </div>
    </div>
  );
};
