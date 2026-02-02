import { useState } from 'react';
import { Search, Edit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserAvatar from '@/components/common/Avatar';
import OnlinePulse from '@/components/common/OnlinePulse';
import { currentUser } from '@/data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface ChatListHeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

const ChatListHeader = ({ onSearch, searchQuery }: ChatListHeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchToggle = () => {
    if (isSearchOpen) {
      onSearch('');
    }
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/95 to-primary border-b border-primary/20 pt-safe shadow-soft">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left side - User avatar or back button */}
        <AnimatePresence mode="wait">
          {isSearchOpen ? (
            <motion.div
              key="search-input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex items-center gap-2"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSearchToggle}
                className="shrink-0 text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
              <Input
                type="text"
                placeholder="Чаты и сообщения..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                autoFocus
                className="flex-1 h-9 bg-white/20 border-none focus-visible:ring-0 text-white placeholder:text-white/70"
              />
            </motion.div>
          ) : (
            <motion.div
              key="header-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 flex-1"
            >
              {/* User avatar - opens settings with online pulse */}
              <button 
                onClick={() => navigate('/settings')}
                className="relative touch-feedback rounded-full"
              >
                <UserAvatar 
                  name={currentUser.name} 
                  size="md"
                  isOnline
                />
                <OnlinePulse size="md" className="border-white" />
              </button>
              
              {/* App title */}
              <h1 className="text-xl font-semibold text-white drop-shadow-sm">Messenger</h1>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Right side - Actions */}
        {!isSearchOpen && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearchToggle}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <Search className="h-5 w-5" />
            </Button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/contacts')}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Edit className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </header>
  );
};

export default ChatListHeader;
