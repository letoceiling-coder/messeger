import { useRef, useEffect } from 'react';

const INPUT_BAR_MIN_H = 48;
const INPUT_BAR_MAX_H = 160; // Примерно 5-6 строк
const BTN_ICON = 'shrink-0 p-2 rounded-full text-app-text-secondary hover:text-app-text hover:bg-app-surface-hover transition-colors';

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
  /** Автофокус при монтировании */
  autoFocus?: boolean;
  /** Ref для textarea (для вставки эмодзи в позицию курсора) */
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
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
  autoFocus = false,
  textareaRef: externalTextareaRef,
}: MessageInputBarProps) => {
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalTextareaRef || internalTextareaRef;
  const canSend = (value.trim().length > 0 || hasAttachments) && !isSending;

  // Автофокус при монтировании (desktop)
  useEffect(() => {
    if (autoFocus && textareaRef.current && window.innerWidth >= 768) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Авторост для textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(scrollHeight, INPUT_BAR_MAX_H);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isSending) return;
    if (!value.trim() && !hasAttachments) return;
    onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter без Shift — отправка
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSubmit();
    }
    // Shift+Enter — новая строка (обрабатывается по умолчанию)
  };

  const showSendButton = canSend;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-0 w-full">
      <div
        className="flex items-end gap-1 w-full rounded-xl bg-app-surface px-2 py-2 focus-within:ring-2 focus-within:ring-app-accent"
        style={{ minHeight: INPUT_BAR_MIN_H }}
      >
        {/* Смайлик (слева) */}
        <button
          type="button"
          onClick={onEmojiClick}
          className={BTN_ICON}
          title="Эмодзи"
          aria-label="Эмодзи"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Textarea (центр) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-2 py-2 bg-transparent text-app-text placeholder-app-text-secondary focus:outline-none border-0 text-base resize-none overflow-y-auto"
          style={{ 
            minHeight: INPUT_BAR_MIN_H - 16,
            maxHeight: INPUT_BAR_MAX_H 
          }}
          disabled={disabled}
          rows={1}
          autoComplete="off"
          aria-label="Сообщение"
        />

        {/* Скрепка (справа от поля) */}
        <button
          type="button"
          onClick={onAttachmentClick}
          className={BTN_ICON}
          title="Прикрепить файл"
          aria-label="Прикрепить"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Кнопка отправки (стрелка) или микрофон */}
        {showSendButton ? (
          <button
            type="submit"
            disabled={!canSend}
            className="shrink-0 p-2 rounded-full bg-app-accent hover:bg-app-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            title="Отправить (Enter)"
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
          <div className="shrink-0">{renderMic}</div>
        ) : null}
      </div>
    </form>
  );
};
