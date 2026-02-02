import { useState, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/common/Avatar';
import { CallSession } from '@/types/messenger';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface VideoCallScreenProps {
  call: CallSession;
  durationSeconds: number;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onSwitchCamera: () => void;
  isOutgoing?: boolean;
}

const PIP_SIZE = 120;
const PIP_PADDING = 16;

export default function VideoCallScreen({
  call,
  durationSeconds,
  onEnd,
  onToggleMute,
  onToggleCamera,
  onSwitchCamera,
  isOutgoing = false,
}: VideoCallScreenProps) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const x = useMotionValue(typeof window !== 'undefined' ? window.innerWidth - PIP_SIZE - PIP_PADDING : 0);
  const y = useMotionValue(PIP_PADDING + 60);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col bg-black"
      onClick={() => setControlsVisible((v) => !v)}
    >
      {/* Fullscreen remote video — placeholder */}
      <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
        <UserAvatar
          name={call.contact.name}
          size="2xl"
          isOnline={call.contact.isOnline}
          className="opacity-80"
        />
      </div>

      {/* Overlay: name, status — spec 10.4 */}
      {controlsVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-0 left-0 right-0 pt-safe px-4 py-3 bg-gradient-to-b from-black/60 to-transparent"
        >
          <p className="text-white font-semibold">{call.contact.name}</p>
          <p className="text-white/80 text-sm">
            {call.state === 'connected'
              ? formatDuration(durationSeconds)
              : call.state === 'reconnecting'
                ? 'Переподключение…'
                : 'Подключение…'}
          </p>
        </motion.div>
      )}

      {/* Self PiP — draggable, spec 10.4, 10.6 */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        style={{ x, y }}
        onDragEnd={(_, info: PanInfo) => {
          const w = typeof window !== 'undefined' ? window.innerWidth : 400;
          const h = typeof window !== 'undefined' ? window.innerHeight : 700;
          const snapX = info.offset.x < w / 2 ? PIP_PADDING : w - PIP_SIZE - PIP_PADDING;
          const snapY = Math.max(PIP_PADDING, Math.min(h - PIP_SIZE - PIP_PADDING - 80, info.offset.y));
          x.set(snapX);
          y.set(snapY);
        }}
        className="absolute top-[calc(env(safe-area-inset-top)+60px)] right-4 w-[120px] h-[160px] rounded-xl overflow-hidden bg-muted border-2 border-background shadow-lg z-10"
      >
        {call.cameraOff ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <UserAvatar name="Вы" size="lg" />
          </div>
        ) : (
          <div className="w-full h-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Камера</span>
          </div>
        )}
      </motion.div>

      {/* Floating buttons — spec 10.4, 10.6 */}
      {controlsVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 pb-safe pb-8 flex items-center justify-center gap-4"
        >
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full border-white/30 bg-black/40 text-white hover:bg-black/60"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
          >
            {call.muted ? (
              <MicOff className="h-5 w-5 text-destructive" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full border-white/30 bg-black/40 text-white hover:bg-black/60"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCamera();
            }}
          >
            {call.cameraOff ? (
              <VideoOff className="h-5 w-5 text-destructive" />
            ) : (
              <Video className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full border-white/30 bg-black/40 text-white hover:bg-black/60"
            onClick={(e) => {
              e.stopPropagation();
              onSwitchCamera();
            }}
          >
            <SwitchCamera className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.stopPropagation();
              onEnd();
            }}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
