import { useRef, useEffect } from 'react';

const MAX_TEXTAREA_ROWS = 5;
const LINE_HEIGHT = 24;

interface MessageInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onEmojiClick: () => void;
  onAttachmentClick: () => void;
  placeholder?: string;
  disabled?: boolean;
  isSending?: boolean;
  /** Есть выбранные вложения (фото/видео) — кнопка отправки активна */
  hasAttachments?: boolean;
  /** Рендер кнопки микрофона (голосовые) */
  renderMic?: React.ReactNode;
}

export const MessageInputBar = ({
  value,
  onChange,
  onSubmit,
  onEmojiClick,
  onAttachmentClick,
  placeholder = 'Сообщение',
  disabled,
  isSending,
  hasAttachments = false,
  renderMic,
}: MessageInputBarProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = (value.trim().length > 0 || hasAttachments) && !isSending;

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineCount = (el.value || '').split('\n').length;
    const rows = Math.min(Math.max(1, lineCount), MAX_TEXTAREA_ROWS);
    el.style.height = `${rows * LINE_HEIGHT}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isSending) return;
    if (!value.trim() && !hasAttachments) return;
    onSubmit();
  };

  const showSendButton = canSend;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 min-h-0 w-full">
      <div className="flex items-end gap-2 min-h-0 w-full">
        <button
          type="button"
          onClick={onEmojiClick}
          className="shrink-0 p-2.5 rounded-full bg-[#2d2d2f] hover:bg-[#3d3d3f] text-[#86868a] hover:text-white self-center pb-1"
          title="Эмодзи"
          aria-label="Эмодзи"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={1}
          className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-[#2d2d2f] text-white placeholder-[#86868a] focus:outline-none focus:ring-2 focus:ring-[#0a84ff] resize-none overflow-y-auto max-h-[120px]"
          style={{ height: LINE_HEIGHT, lineHeight: `${LINE_HEIGHT}px` }}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSubmit();
            }
          }}
        />
        <button
          type="button"
          onClick={onAttachmentClick}
          className="shrink-0 p-2.5 rounded-full bg-[#2d2d2f] hover:bg-[#3d3d3f] text-[#86868a] hover:text-white self-center pb-1"
          title="Прикрепить файл"
          aria-label="Прикрепить"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
          </svg>
        </button>
        {showSendButton ? (
          <button
            type="submit"
            disabled={!canSend}
            className="shrink-0 p-2.5 rounded-full bg-[#0a84ff] hover:bg-[#409cff] disabled:opacity-50 disabled:cursor-not-allowed self-center pb-1 text-white"
            title="Отправить"
            aria-label="Отправить"
          >
            {isSending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        ) : renderMic != null ? (
          <div className="shrink-0 self-center pb-1">{renderMic}</div>
        ) : null}
      </div>
    </form>
  );
};
