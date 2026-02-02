import { useMemo } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import { calls, formatCallDuration } from '@/data/mockData';
import { useCall } from '@/context/CallContext';
import { Call } from '@/types/messenger';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const CallsPage = () => {
  const { startOutgoingCall, setIncomingCall } = useCall();

  // Group calls by date
  const groupedCalls = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const groups: { label: string; calls: Call[] }[] = [];
    const todayCalls: Call[] = [];
    const yesterdayCalls: Call[] = [];
    const olderCalls: Call[] = [];
    
    calls.forEach(call => {
      const callDate = new Date(call.timestamp);
      callDate.setHours(0, 0, 0, 0);
      
      if (callDate.getTime() === today.getTime()) {
        todayCalls.push(call);
      } else if (callDate.getTime() === yesterday.getTime()) {
        yesterdayCalls.push(call);
      } else {
        olderCalls.push(call);
      }
    });
    
    if (todayCalls.length > 0) groups.push({ label: 'Сегодня', calls: todayCalls });
    if (yesterdayCalls.length > 0) groups.push({ label: 'Вчера', calls: yesterdayCalls });
    if (olderCalls.length > 0) groups.push({ label: 'Ранее', calls: olderCalls });
    
    return groups;
  }, []);

  const getCallIcon = (call: Call) => {
    const iconClass = cn(
      'h-4 w-4',
      call.status === 'missed' || call.status === 'declined' 
        ? 'text-destructive' 
        : 'text-[hsl(var(--online-green))]'
    );
    
    switch (call.status) {
      case 'incoming':
        return <PhoneIncoming className={iconClass} />;
      case 'outgoing':
        return <PhoneOutgoing className={iconClass} />;
      case 'missed':
      case 'declined':
        return <PhoneMissed className={iconClass} />;
      default:
        return <Phone className={iconClass} />;
    }
  };

  const getCallStatusText = (call: Call) => {
    const time = call.timestamp.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    let status = '';
    switch (call.status) {
      case 'incoming':
        status = 'Входящий';
        break;
      case 'outgoing':
        status = 'Исходящий';
        break;
      case 'missed':
        status = 'Пропущенный';
        break;
      case 'declined':
        status = 'Отклонённый';
        break;
    }
    
    const duration = call.duration ? `, ${formatCallDuration(call.duration)}` : '';
    
    return `${status}${duration} · ${time}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border pt-safe">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-xl font-semibold">Звонки</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs"
              onClick={() => {
                const contact = calls[0]?.contact;
                if (contact) setIncomingCall(contact, 'audio');
              }}
            >
              Тест входящего
            </Button>
            <Button variant="ghost" size="sm" className="text-primary">
              Изменить
            </Button>
          </div>
        </div>
      </header>

      {/* Calls list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pb-4"
      >
        {groupedCalls.length > 0 ? (
          groupedCalls.map((group) => (
            <div key={group.label}>
              {/* Date header */}
              <div className="sticky top-14 bg-secondary/80 backdrop-blur-sm px-4 py-2 z-10">
                <span className="text-sm font-medium text-muted-foreground">
                  {group.label}
                </span>
              </div>
              
              {/* Calls in group */}
              {group.calls.map((call) => (
                <motion.div
                  key={call.id}
                  whileTap={{ backgroundColor: 'hsl(var(--secondary))' }}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-secondary"
                >
                  <UserAvatar
                    name={call.contact.name}
                    size="lg"
                    isOnline={call.contact.isOnline}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium truncate',
                      (call.status === 'missed' || call.status === 'declined') && 'text-destructive'
                    )}>
                      {call.contact.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {getCallIcon(call)}
                      <span>{getCallStatusText(call)}</span>
                    </div>
                  </div>
                  
                  {/* Call button — spec 10: start outgoing call */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary shrink-0"
                    onClick={() => startOutgoingCall(call.contact, call.type)}
                  >
                    {call.type === 'video' ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <Phone className="h-5 w-5" />
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          ))
        ) : (
          <EmptyState
            icon={Phone}
            title="Нет звонков"
            description="История звонков появится здесь после первого разговора"
          />
        )}
      </motion.div>
    </div>
  );
};

export default CallsPage;
