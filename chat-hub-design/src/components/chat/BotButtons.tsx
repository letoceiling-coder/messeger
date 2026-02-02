import type { Message, BotButton } from '@/types/messenger';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check, ExternalLink } from 'lucide-react';

interface BotButtonsProps {
  message: Message;
  /** Для reply-кнопок: был ли уже отправлен ответ с этим текстом (показываем выбранное состояние #25D366) */
  isReplySelected: (labelOrAction: string) => boolean;
  onInlineClick: (button: BotButton) => void;
  onReplyClick: (button: BotButton) => void;
  onUrlClick: (url: string) => void;
}

/** Inline: #006CFF bg, белый текст, скруглённые углы. Reply: #DCF8C6 ожидание, #25D366 выбран. URL: открыть в браузере. */
export default function BotButtons({
  message,
  isReplySelected,
  onInlineClick,
  onReplyClick,
  onUrlClick,
}: BotButtonsProps) {
  const buttons = message.buttons ?? [];
  if (buttons.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {buttons.map((btn, i) => {
        if (btn.type === 'inline') {
          return (
            <motion.button
              key={i}
              type="button"
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.1 }}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2',
                'bg-[#006CFF] hover:bg-[#0052CC] active:bg-[#004099]',
                'border-0 shadow-sm'
              )}
              style={{ backgroundColor: '#006CFF' }}
              onClick={() => onInlineClick(btn)}
            >
              <Zap className="h-4 w-4 shrink-0" />
              {btn.label}
            </motion.button>
          );
        }
        if (btn.type === 'reply') {
          const selected = isReplySelected(btn.action ?? btn.label);
          return (
            <motion.button
              key={i}
              type="button"
              whileTap={{ scale: 0.98 }}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                selected
                  ? 'bg-[#25D366] text-white'
                  : 'bg-[#DCF8C6] text-foreground hover:bg-[#c8f0b8]'
              )}
              style={selected ? { backgroundColor: '#25D366' } : { backgroundColor: '#DCF8C6' }}
              onClick={() => onReplyClick(btn)}
            >
              {btn.label}
              {selected && <Check className="h-4 w-4 shrink-0" />}
            </motion.button>
          );
        }
        if (btn.type === 'url' && btn.url) {
          return (
            <motion.button
              key={i}
              type="button"
              whileTap={{ scale: 0.98 }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#006CFF] bg-[#006CFF]/10 hover:bg-[#006CFF]/20 flex items-center gap-2 border border-[#006CFF]/30"
              onClick={() => onUrlClick(btn.url!)}
            >
              {btn.label}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </motion.button>
          );
        }
        return null;
      })}
    </div>
  );
}
