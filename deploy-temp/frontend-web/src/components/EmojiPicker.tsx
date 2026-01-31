import { useEffect, useRef, useState } from 'react';

const EMOJI_CATEGORIES = {
  smiles: {
    name: '😊 Смайлики',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓'],
  },
  emotions: {
    name: '💔 Эмоции',
    emojis: ['😢', '😭', '😤', '😠', '😡', '🤬', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮', '😯', '😲'],
  },
  gestures: {
    name: '👋 Жесты',
    emojis: ['👍', '👎', '👏', '🙌', '👋', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '🤏', '✊', '👊', '🤛', '🤜', '👐', '🙌', '👏', '🤝', '💪', '🦾'],
  },
  hearts: {
    name: '❤️ Сердца',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  },
  symbols: {
    name: '✨ Символы',
    emojis: ['🔥', '⭐', '✨', '💫', '🌟', '💥', '💯', '✅', '❌', '❗', '❓', '💬', '🗨️', '💭', '🗯️', '🎉', '🎊', '🎈', '🏆', '🏅', '🎯', '💰', '💎', '👑'],
  },
  animals: {
    name: '🐶 Животные',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉'],
  },
  food: {
    name: '🍕 Еда',
    emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧈', '🍖', '🍗', '🥩', '🥓', '🍞', '🥐', '🥖', '🥨', '🧀', '🥚', '🍳', '🧇', '🥞', '🧈', '🍩', '🍪', '🎂', '🍰'],
  },
  activity: {
    name: '⚽ Активность',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽'],
  },
};

interface EmojiPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  /** Элемент, относительно которого позиционировать панель (например, кнопка смайлика) */
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export const EmojiPicker = ({ open, onClose, onSelect, anchorRef }: EmojiPickerProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smiles');

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

  const categories = Object.keys(EMOJI_CATEGORIES) as (keyof typeof EMOJI_CATEGORIES)[];
  const currentEmojis = EMOJI_CATEGORIES[activeCategory].emojis;

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full left-0 mb-1 w-[320px] rounded-xl bg-app-surface border border-app-border shadow-2xl overflow-hidden z-50"
      role="dialog"
      aria-label="Выбор эмодзи"
    >
      {/* Категории */}
      <div className="flex items-center gap-1 p-2 border-b border-app-border overflow-x-auto scrollbar-thin">
        {categories.map((cat) => {
          const isActive = cat === activeCategory;
          const firstEmoji = EMOJI_CATEGORIES[cat].emojis[0];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-colors ${
                isActive
                  ? 'bg-app-accent text-white'
                  : 'hover:bg-app-surface-hover'
              }`}
              title={EMOJI_CATEGORIES[cat].name}
            >
              {firstEmoji}
            </button>
          );
        })}
      </div>

      {/* Сетка эмодзи */}
      <div className="max-h-[240px] overflow-y-auto p-2">
        <div className="grid grid-cols-8 gap-1">
          {currentEmojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-app-surface-hover text-xl leading-none transition-colors active:scale-95"
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              aria-label={`Вставить эмодзи ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
