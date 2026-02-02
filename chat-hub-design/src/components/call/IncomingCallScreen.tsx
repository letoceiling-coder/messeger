import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/common/Avatar';
import { CallSession } from '@/types/messenger';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IncomingCallScreenProps {
  call: CallSession;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallScreen({
  call,
  onAccept,
  onDecline,
}: IncomingCallScreenProps) {
  const isVideo = call.type === 'video';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col bg-background"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-safe">
        {/* Big avatar — spec 10.2 */}
        <UserAvatar
          name={call.contact.name}
          size="2xl"
          isOnline={call.contact.isOnline}
          className="mb-6 ring-4 ring-background/50"
        />
        <p className="text-xl font-semibold">{call.contact.name}</p>
        <p className="text-muted-foreground mt-1">
          {isVideo ? 'Входящий видеозвонок' : 'Входящий звонок'}
        </p>
      </div>

      {/* Buttons — Accept (green), Decline (red) — spec 10.2, 10.5 */}
      <div className="flex items-center justify-center gap-8 pb-safe pb-12">
        <Button
          size="icon"
          className="h-16 w-16 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={onDecline}
        >
          <PhoneOff className="h-8 w-8" />
        </Button>
        <Button
          size="icon"
          className={cn(
            'h-16 w-16 rounded-full',
            'bg-[hsl(var(--online-green))] text-white hover:opacity-90'
          )}
          onClick={onAccept}
        >
          {isVideo ? (
            <Video className="h-8 w-8" />
          ) : (
            <Phone className="h-8 w-8" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}
