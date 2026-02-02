import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { CallNetworkState } from '@/types/messenger';
import { cn } from '@/lib/utils';

interface CallNetworkOverlayProps {
  state: CallNetworkState;
}

const labels: Record<CallNetworkState, string> = {
  good: '',
  poor: 'Плохое соединение',
  reconnecting: 'Переподключение…',
  lost: 'Соединение потеряно',
};

export default function CallNetworkOverlay({ state }: CallNetworkOverlayProps) {
  if (state === 'good') return null;

  const Icon =
    state === 'lost' ? WifiOff : state === 'reconnecting' ? RefreshCw : AlertTriangle;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-[210] flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium',
          state === 'lost' && 'bg-destructive/90 text-destructive-foreground',
          state === 'reconnecting' && 'bg-amber-500/90 text-amber-950',
          state === 'poor' && 'bg-amber-500/80 text-amber-950'
        )}
      >
        {state === 'reconnecting' && (
          <RefreshCw className="h-4 w-4 animate-spin" />
        )}
        {state !== 'reconnecting' && <Icon className="h-4 w-4" />}
        <span>{labels[state]}</span>
      </motion.div>
    </AnimatePresence>
  );
}
