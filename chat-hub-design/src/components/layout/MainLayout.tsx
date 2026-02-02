import { useLocation } from 'react-router-dom';
import PageTransition from '@/components/common/PageTransition';
import BottomNav from './BottomNav';
import { useMemo } from 'react';
import { useChats } from '@/context/ChatsContext';
import { useAppState } from '@/context/AppStateContext';
import { calls } from '@/data/mockData';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = () => {
  const location = useLocation();
  const { chats } = useChats();
  const { isOnline } = useAppState();

  const hideBottomNav = useMemo(() => {
    return location.pathname.startsWith('/chat/') ||
           location.pathname.startsWith('/call/');
  }, [location.pathname]);

  const unreadChats = useMemo(() => {
    return chats.reduce((sum, chat) => sum + chat.unreadCount, 0);
  }, [chats]);

  const missedCalls = useMemo(() => {
    return calls.filter((call) => call.status === 'missed').length;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/90 text-amber-950 text-center py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <WifiOff className="h-4 w-4" />
            Нет подключения к интернету
          </motion.div>
        )}
      </AnimatePresence>
      <main className={hideBottomNav ? '' : 'pb-16'}>
        <PageTransition />
      </main>

      {!hideBottomNav && (
        <BottomNav unreadChats={unreadChats} missedCalls={missedCalls} />
      )}
    </div>
  );
};

export default MainLayout;
