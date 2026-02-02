import {
  Image,
  Video,
  FileText,
  MapPin,
  User,
  BarChart3,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { motion } from 'framer-motion';

export type AttachAction =
  | 'photo'
  | 'video'
  | 'file'
  | 'location'
  | 'contact'
  | 'poll';

interface AttachSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (action: AttachAction) => void;
}

const attachItems: { id: AttachAction; label: string; icon: React.ReactNode }[] = [
  { id: 'photo', label: 'Фото или видео', icon: <Image className="h-6 w-6" /> },
  { id: 'file', label: 'Файл', icon: <FileText className="h-6 w-6" /> },
  { id: 'location', label: 'Геолокация', icon: <MapPin className="h-6 w-6" /> },
  { id: 'contact', label: 'Контакт', icon: <User className="h-6 w-6" /> },
  { id: 'poll', label: 'Опрос', icon: <BarChart3 className="h-6 w-6" /> },
];

const AttachSheet = ({ open, onOpenChange, onSelect }: AttachSheetProps) => {
  const handleSelect = (action: AttachAction) => {
    onSelect(action);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-t shadow-modal pb-safe h-auto max-h-[70vh] pt-4 px-4 pb-6"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Прикрепить</SheetTitle>
        </SheetHeader>
        {/* Заголовок и сетка как на референсе */}
        <div className="mb-4">
          <p className="text-sm font-medium text-muted-foreground">Прикрепить</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {attachItems.map((item, index) => (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(item.id)}
              className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-background border border-border/50 hover:bg-secondary active:bg-secondary transition-colors text-center min-h-[100px]"
            >
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary shrink-0">
                {item.icon}
              </span>
              <span className="font-medium text-sm text-foreground">{item.label}</span>
            </motion.button>
          ))}
        </div>
        {/* Ручка внизу по центру */}
        <div className="flex justify-center pt-4 mt-2">
          <span className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AttachSheet;
