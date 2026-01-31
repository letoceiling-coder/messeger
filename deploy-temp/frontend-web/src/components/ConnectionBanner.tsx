import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';

export const ConnectionBanner = () => {
  const { connectionStatus } = useWebSocket();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated || connectionStatus === 'connected') return null;

  const text =
    connectionStatus === 'reconnecting'
      ? 'Переподключение к серверу…'
      : 'Нет соединения. Сообщения могут не доставляться.';

  return (
    <div
      className="px-4 py-2 flex items-center justify-center gap-3 text-sm bg-amber-600/95 text-white shrink-0"
      role="alert"
    >
      <span>{text}</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 font-medium"
      >
        Обновить страницу
      </button>
    </div>
  );
};
