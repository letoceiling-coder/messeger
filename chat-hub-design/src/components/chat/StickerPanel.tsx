import { useState, useCallback } from 'react';
import { Search, Star, Clock, Package } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useStickers } from '@/context/StickerContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Sticker } from '@/types/messenger';

const TABS = [
  { id: 'recent' as const, label: 'Недавние', icon: Clock },
  { id: 'favorites' as const, label: 'Избранное', icon: Star },
  { id: 'packs' as const, label: 'Наборы', icon: Package },
];

export default function StickerPanel() {
  const {
    panelOpen,
    closePanel,
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    activePackId,
    setActivePackId,
    packs,
    sendSticker,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getStickersForTab,
  } = useStickers();

  const [longPressId, setLongPressId] = useState<string | null>(null);
  const stickers = getStickersForTab();

  const handleStickerClick = useCallback(
    (sticker: Sticker) => {
      sendSticker(sticker.id);
    },
    [sendSticker]
  );

  const handleStickerContextMenu = useCallback(
    (e: React.MouseEvent, stickerId: string) => {
      e.preventDefault();
      if (isFavorite(stickerId)) removeFromFavorites(stickerId);
      else addToFavorites(stickerId);
    },
    [isFavorite, addToFavorites, removeFromFavorites]
  );

  return (
    <Sheet open={panelOpen} onOpenChange={(open) => !open && closePanel()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-t shadow-modal pb-safe h-[50vh] max-h-[400px] flex flex-col p-0 gap-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Стикеры</SheetTitle>
        </SheetHeader>

        {/* Верхняя панель: табы и поиск */}
        <div className="shrink-0 border-b px-3 py-2 space-y-2">
          <div className="flex gap-1 p-0.5 rounded-lg bg-muted">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors',
                  tab === t.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по эмодзи или слову..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 bg-muted border-0"
            />
          </div>
        </div>

        {/* Сетка стикеров */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
          <AnimatePresence mode="wait">
            {stickers.length === 0 ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground text-center py-8"
              >
                {searchQuery.trim()
                  ? 'Ничего не найдено'
                  : tab === 'recent'
                    ? 'Нет недавних стикеров'
                    : tab === 'favorites'
                      ? 'Добавьте стикеры в избранное (долгое нажатие)'
                      : 'Выберите набор ниже'}
              </motion.p>
            ) : (
              <motion.div
                key={`${tab}-${activePackId}-${searchQuery}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-5 gap-1"
              >
                {stickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => handleStickerClick(sticker)}
                    onContextMenu={(e) => handleStickerContextMenu(e, sticker.id)}
                    onTouchStart={() => setLongPressId(null)}
                    onTouchEnd={() => setLongPressId(null)}
                    className={cn(
                      'aspect-square rounded-xl flex items-center justify-center p-1.5',
                      'hover:bg-muted active:scale-95 transition-transform',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                    )}
                  >
                    <img
                      src={sticker.url}
                      alt={sticker.emoji ?? ''}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Нижняя панель: наборы (только для таба Packs и без поиска) */}
        {tab === 'packs' && !searchQuery.trim() && (
          <div className="shrink-0 border-t px-2 py-2 flex gap-1 overflow-x-auto">
            {packs.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => setActivePackId(pack.id)}
                className={cn(
                  'shrink-0 w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border-2 transition-colors',
                  activePackId === pack.id
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent bg-muted hover:bg-muted/80'
                )}
              >
                <img
                  src={pack.iconUrl}
                  alt={pack.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Ручка внизу */}
        <div className="shrink-0 flex justify-center py-2">
          <span className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden />
        </div>
      </SheetContent>
    </Sheet>
  );
}
