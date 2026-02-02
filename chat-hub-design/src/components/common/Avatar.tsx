import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  className?: string;
}

const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const getInitials = (name: string): string => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-24 w-24 text-2xl',
};

const onlineSizeClasses = {
  sm: 'h-2.5 w-2.5 right-0 bottom-0',
  md: 'h-3 w-3 right-0 bottom-0',
  lg: 'h-3.5 w-3.5 right-0.5 bottom-0.5',
  xl: 'h-4 w-4 right-1 bottom-1',
  '2xl': 'h-5 w-5 right-2 bottom-2',
};

const UserAvatar = ({ src, name, size = 'md', isOnline, className }: AvatarProps) => {
  return (
    <div className="relative inline-block">
      <ShadcnAvatar className={cn(sizeClasses[size], className)}>
        {src ? (
          <AvatarImage src={src} alt={name} className="object-cover" />
        ) : null}
        <AvatarFallback 
          className={cn(
            'text-white font-medium',
            getAvatarColor(name)
          )}
        >
          {getInitials(name)}
        </AvatarFallback>
      </ShadcnAvatar>
      
      {isOnline && (
        <span 
          className={cn(
            'absolute rounded-full bg-[hsl(var(--online-green))] ring-2 ring-background',
            onlineSizeClasses[size]
          )}
        />
      )}
    </div>
  );
};

export default UserAvatar;
