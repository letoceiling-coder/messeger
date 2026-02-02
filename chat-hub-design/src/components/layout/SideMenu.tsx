import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageCircle,
  Phone,
  Users,
  Settings,
  UserPlus,
  HelpCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SideMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const items: { path?: string; icon: typeof MessageCircle; label: string; action?: string }[] = [
  { path: '/', icon: MessageCircle, label: 'Избранные сообщения' },
  { path: '/calls', icon: Phone, label: 'Звонки' },
  { path: '/contacts', icon: Users, label: 'Контакты' },
  { path: '/settings', icon: Settings, label: 'Настройки' },
  { icon: UserPlus, label: 'Пригласить друзей', action: 'invite' },
  { icon: HelpCircle, label: 'Помощь', action: 'help' },
];

export default function SideMenu({ open, onOpenChange }: SideMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelect = (path?: string, action?: string) => {
    if (path) {
      navigate(path);
      onOpenChange(false);
    }
    if (action === 'invite') {
      onOpenChange(false);
      // TODO: invite flow
    }
    if (action === 'help') {
      onOpenChange(false);
      // TODO: help
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[280px] sm:max-w-[85vw] p-0 flex flex-col border-r bg-background"
      >
        <SheetHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-lg font-semibold">Меню</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>
        <nav className="flex-1 overflow-auto py-2">
          {items.map((item, index) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              whileTap={{ backgroundColor: 'hsl(var(--secondary))' }}
              onClick={() => handleSelect(item.path, item.action)}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-3 text-left',
                item.path !== undefined &&
                  item.path === location.pathname &&
                  'bg-secondary/50 font-medium'
              )}
            >
              <item.icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <span>{item.label}</span>
            </motion.button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
