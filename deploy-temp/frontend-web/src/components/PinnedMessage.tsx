import { Message } from '../types';

interface PinnedMessageProps {
  message: Message;
  onClose: () => void;
  onClick: () => void;
}

export const PinnedMessage = ({ message, onClose, onClick }: PinnedMessageProps) => {
  const getMessagePreview = () => {
    if (message.messageType === 'voice') return '🎤 Голосовое сообщение';
    if (message.messageType === 'image') return '🖼 Фото';
    if (message.messageType === 'video') return '🎥 Видео';
    if (message.messageType === 'document') return `📎 ${message.fileName || 'Документ'}`;
    return message.content || '';
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-app-surface border-b border-app-border">
      {/* Иконка закрепления */}
      <div className="flex-shrink-0 text-app-accent">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      </div>

      {/* Содержимое */}
      <button
        onClick={onClick}
        className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
      >
        <p className="text-xs text-app-text-secondary font-medium">Закрепленное сообщение</p>
        <p className="text-sm text-app-text truncate">{getMessagePreview()}</p>
      </button>

      {/* Кнопка закрытия */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="flex-shrink-0 p-1.5 rounded-full hover:bg-app-surface-hover text-app-text-secondary hover:text-app-text transition-colors"
        aria-label="Открепить сообщение"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
