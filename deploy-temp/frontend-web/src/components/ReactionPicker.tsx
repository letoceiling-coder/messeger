import { useState } from 'react';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

export const ReactionPicker = ({ onSelect, onClose }: ReactionPickerProps) => {
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <div className="absolute bottom-full left-0 mb-2 z-30">
      <div className="bg-app-surface rounded-2xl shadow-2xl border border-app-border px-2 py-2 flex gap-1">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSelect(emoji)}
            onMouseEnter={() => setHoveredEmoji(emoji)}
            onMouseLeave={() => setHoveredEmoji(null)}
            className={`
              w-10 h-10 flex items-center justify-center text-2xl rounded-lg
              hover:bg-app-surface-hover transition-all
              ${hoveredEmoji === emoji ? 'scale-125 -translate-y-1' : 'scale-100'}
            `}
          >
            {emoji}
          </button>
        ))}
      </div>
      {/* Треугольник */}
      <div className="absolute left-4 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-app-surface"></div>
    </div>
  );
};
