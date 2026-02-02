import { PhoneOff, Mic, MicOff, Volume2, VolumeX, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/common/Avatar';
import { CallSession } from '@/types/messenger';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface ActiveCallScreenProps {
  call: CallSession;
  durationSeconds: number;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  isGroup?: boolean;
}

export default function ActiveCallScreen({
  call,
  durationSeconds,
  onEnd,
  onToggleMute,
  onToggleSpeaker,
  isGroup = false,
}: ActiveCallScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col bg-background"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-safe">
        <UserAvatar
          name={call.contact.name}
          size="2xl"
          isOnline={call.contact.isOnline}
          className="mb-4"
        />
        <p className="text-xl font-semibold">{call.contact.name}</p>
        {/* Timer — spec 10.3 */}
        <p className="text-muted-foreground font-mono text-lg mt-2">
          {formatDuration(durationSeconds)}
        </p>
      </div>

      {/* Controls — Mute, Speaker, Add user (group), End — spec 10.3 */}
      <div className="flex items-center justify-center gap-6 pb-safe pb-12">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-2"
          onClick={onToggleSpeaker}
        >
          {call.speaker ? (
            <Volume2 className="h-6 w-6" />
          ) : (
            <VolumeX className="h-6 w-6" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-14 w-14 rounded-full border-2',
            call.muted && 'border-destructive text-destructive'
          )}
          onClick={onToggleMute}
        >
          {call.muted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
        {isGroup && (
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full border-2"
          >
            <UserPlus className="h-6 w-6" />
          </Button>
        )}
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={onEnd}
        >
          <PhoneOff className="h-7 w-7" />
        </Button>
      </div>
    </motion.div>
  );
}
