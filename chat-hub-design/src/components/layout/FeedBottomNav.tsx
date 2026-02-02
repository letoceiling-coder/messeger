import { Home, Search, PlusSquare, Bell, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface FeedBottomNavProps {
  notificationCount?: number;
}

const FeedBottomNav = ({ notificationCount = 0 }: FeedBottomNavProps) => {
  const location = useLocation();

  const navItems: NavItem[] = [
    { path: '/feed', label: 'Лента', icon: <Home className="h-6 w-6" /> },
    { path: '/feed/search', label: 'Поиск', icon: <Search className="h-6 w-6" /> },
    { path: '/feed/create', label: 'Создать', icon: <PlusSquare className="h-6 w-6" /> },
    {
      path: '/feed/notifications',
      label: 'Уведомления',
      icon: <Bell className="h-6 w-6" />,
      badge: notificationCount,
    },
    { path: '/feed/profile', label: 'Профиль', icon: <User className="h-6 w-6" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === '/feed' && location.pathname === '/feed') ||
            (item.path !== '/feed' && location.pathname.startsWith(item.path));

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
                {item.badge != null && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium"
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

export default FeedBottomNav;
