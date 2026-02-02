import { MessageCircle, Users, Phone, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface BottomNavProps {
  unreadChats?: number;
  missedCalls?: number;
}

const BottomNav = ({ unreadChats = 0, missedCalls = 0 }: BottomNavProps) => {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      path: '/',
      label: 'Чаты',
      icon: <MessageCircle className="h-6 w-6" />,
      badge: unreadChats,
    },
    {
      path: '/contacts',
      label: 'Контакты',
      icon: <Users className="h-6 w-6" />,
    },
    {
      path: '/calls',
      label: 'Звонки',
      icon: <Phone className="h-6 w-6" />,
      badge: missedCalls,
    },
    {
      path: '/settings',
      label: 'Настройки',
      icon: <Settings className="h-6 w-6" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/' && location.pathname.startsWith('/chat/'));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'relative flex flex-col items-center justify-center w-full h-full touch-feedback',
                'transition-colors duration-200'
              )}
            >
              <div className="relative">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={cn(
                    'flex items-center justify-center',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.icon}
                </motion.div>
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 
                      flex items-center justify-center rounded-full 
                      bg-primary text-primary-foreground text-xs font-medium"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.span>
                )}
              </div>
              
              <span
                className={cn(
                  'mt-1 text-xs transition-colors duration-200',
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
