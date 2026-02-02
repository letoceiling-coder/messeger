import type { BotKeyboardRow } from '@/types/messenger';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BotKeyboardProps {
  rows: BotKeyboardRow[];
  onButtonPress: (label: string, action?: string) => void;
  className?: string;
}

/** Клавиатура бота: ряды кнопок, фон #25D366, 14px. При нажатии — ripple/смена оттенка. */
export default function BotKeyboard({ rows, onButtonPress, className }: BotKeyboardProps) {
  if (!rows?.length) return null;

  return (
    <div className={cn('flex flex-col gap-1.5 p-2 bg-muted/40 border-t border-border', className)}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2 flex-wrap justify-center">
          {row.map((cell, cellIndex) => (
            <motion.button
              key={cellIndex}
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.1 }}
              className={cn(
                'rounded-lg px-4 py-2.5 text-sm font-medium text-white',
                'hover:opacity-90 active:opacity-80 transition-opacity',
                'border-0 shadow-sm min-w-[80px]'
              )}
              style={{ backgroundColor: '#25D366', fontSize: 14 }}
              onClick={() => onButtonPress(cell.label, cell.action)}
            >
              {cell.label}
            </motion.button>
          ))}
        </div>
      ))}
    </div>
  );
}
