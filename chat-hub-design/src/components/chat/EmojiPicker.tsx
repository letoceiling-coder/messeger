import { cn } from '@/lib/utils';

/** Набор часто используемых эмодзи по категориям */
const EMOJI_SETS: { label: string; emojis: string[] }[] = [
  {
    label: 'Смайлики',
    emojis: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌',
      '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑',
      '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
    ],
  },
  {
    label: 'Жесты',
    emojis: [
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇',
      '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🙏', '✍️', '💅', '🤳',
      '👏', '🙌', '🤲', '🤝', '🙏', '💪', '❤️', '🧡', '💛', '💚', '💙', '💜',
    ],
  },
  {
    label: 'Сердечки и символы',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
      '💞', '💓', '💗', '💖', '💘', '💝', '💟', '✨', '⭐', '🌟', '💫', '🔥',
      '✅', '❌', '❗', '❓', '‼️', '⁉️', '💯', '🎉', '🎊', '🥳', '😎', '🤩',
    ],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export default function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  return (
    <div className={cn('w-[280px] max-h-[320px] overflow-y-auto', className)}>
      {EMOJI_SETS.map((set) => (
        <div key={set.label} className="mb-3">
          <p className="text-xs font-medium text-muted-foreground px-1 mb-1.5">
            {set.label}
          </p>
          <div className="grid grid-cols-8 gap-0.5">
            {set.emojis.map((emoji, i) => (
              <button
                key={`${set.label}-${i}`}
                type="button"
                onClick={() => onSelect(emoji)}
                className="text-xl p-1.5 rounded-md hover:bg-secondary active:scale-95 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label={`Эмодзи ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
