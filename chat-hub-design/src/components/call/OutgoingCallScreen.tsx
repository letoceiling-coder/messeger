import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/common/Avatar';
import { CallSession } from '@/types/messenger';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OutgoingCallScreenProps {
  call: CallSession;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
}

const stateLabels: Record<string, string> = {
  calling: 'Вызов…',
  ringing: 'Звонок…',
  connected: '',
  reconnecting: 'Переподключение…',
};

export default function OutgoingCallScreen({
  call,
  onEnd,
  onToggleMute,
  onToggleSpeaker,
}: OutgoingCallScreenProps) {
  const statusText = stateLabels[call.state] ?? 'Вызов…';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-0 z-[200] flex flex-col bg-background"
    >
      {/* Blurred avatar background — spec 10.1 */}
      <div
        className="absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className={cn(
            'absolute inset-0 bg-muted/80',
            'backdrop-blur-[20px] sm:backdrop-blur-[30px]'
          )}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <UserAvatar
            name={call.contact.name}
            size="2xl"
            isOnline={call.contact.isOnline}
            className="opacity-30 scale-[2.5]"
          />
        </div>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-safe pb-safe">
        {/* Large avatar — spec: крупный круглый аватар по центру */}
        <motion.div
          animate={call.state === 'calling' || call.state === 'ringing' ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="mb-6"
        >
          <UserAvatar
            name={call.contact.name}
            size="2xl"
            isOnline={call.contact.isOnline}
            className="ring-4 ring-background/50"
          />
        </motion.div>

        <p className="text-xl font-semibold text-foreground">{call.contact.name}</p>
        <p className="text-muted-foreground mt-1">{statusText}</p>

        {/* Controls — spec: End (red), Speaker, Mute */}
        <div className="mt-auto flex items-center justify-center gap-6 pb-8">
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
            className="h-14 w-14 rounded-full border-2"
            onClick={onToggleMute}
          >
            {call.muted ? (
              <MicOff className="h-6 w-6 text-destructive" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onEnd}
          >
            <PhoneOff className="h-7 w-7" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
