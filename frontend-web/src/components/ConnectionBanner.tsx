import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';

export const ConnectionBanner = () => {
  const { connectionStatus } = useWebSocket();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated || connectionStatus === 'connected') return null;

  const isReconnecting = connectionStatus === 'reconnecting';
  const text = isReconnecting
    ? 'Переподключение…'
    : 'Нет соединения';

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] px-2 py-px flex items-center justify-center gap-1 text-[9px] leading-none bg-amber-600/90 text-white h-[18px]"
      role="alert"
      style={{ height: '18px', minHeight: '18px', maxHeight: '18px' }}
    >
      {isReconnecting && (
        <svg className="w-2 h-2 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      <span className="font-medium">{text}</span>
    </div>
  );
};
