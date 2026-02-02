import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/** Пустое состояние: иконка, заголовок, описание и опциональная кнопка */
const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center py-16 px-6 text-center',
      className
    )}
  >
    <div className="rounded-full bg-muted p-6 mb-4">
      <Icon className="h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
    </div>
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    {description && (
      <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
        {description}
      </p>
    )}
    {actionLabel && onAction && (
      <Button variant="outline" className="mt-4 rounded-xl" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
