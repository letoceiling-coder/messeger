import { useEffect, useRef } from 'react';

const EMOJI_SET = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😗', '😋', '😛', '😜', '🤪', '😝',
  '👍', '👎', '👏', '🙌', '👋', '🤝', '🙏', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕', '💖', '💗', '💘',
  '🔥', '⭐', '✨', '💫', '🌟', '🙈', '🙉', '🙊', '💯', '✅', '❌', '❗', '❓', '💬', '🗨️', '💭', '🎉', '🎊', '🎈', '🏆',
  '😢', '😭', '😤', '😡', '🤬', '😱', '😨', '😰', '😥', '🤔', '🤨', '😐', '😑', '😶', '😏', '😴', '🤤', '😪', '😵', '🥴',
];

interface EmojiPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  /** Элемент, относительно которого позиционировать панель (например, кнопка смайлика) */
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export const EmojiPicker = ({ open, onClose, onSelect, anchorRef }: EmojiPickerProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const el = panelRef.current;
      const anchor = anchorRef?.current;
      if (el && !el.contains(e.target as Node) && anchor && !anchor.contains(e.target as Node)) {
        onClose();
      }
    };
    const t = setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full left-0 mb-1 w-[280px] max-h-[200px] overflow-y-auto rounded-xl bg-[#2d2d2f] border border-white/10 shadow-xl p-2 z-50"
      role="dialog"
      aria-label="Выбор эмодзи"
    >
      <div className="grid grid-cols-8 gap-1">
        {EMOJI_SET.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-xl leading-none"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
