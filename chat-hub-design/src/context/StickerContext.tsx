import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { StickerStateType, Sticker, StickerPack } from '@/types/messenger';
import {
  defaultStickerPacks,
  getStoredFavorites,
  setStoredFavorites,
  getStoredRecent,
  setStoredRecent,
  findStickerById,
  searchStickers,
} from '@/data/stickerPacks';

type StickerTab = 'recent' | 'favorites' | 'packs';

interface StickerContextValue {
  stickerState: StickerStateType;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  setStickerState: (s: StickerStateType) => void;
  packs: StickerPack[];
  activePackId: string | null;
  setActivePackId: (id: string | null) => void;
  tab: StickerTab;
  setTab: (t: StickerTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  recentStickerIds: string[];
  favoriteStickerIds: string[];
  addToRecent: (stickerId: string) => void;
  addToFavorites: (stickerId: string) => void;
  removeFromFavorites: (stickerId: string) => void;
  isFavorite: (stickerId: string) => boolean;
  sendSticker: (stickerId: string) => void;
  onSendSticker?: (sticker: Sticker) => void;
  getStickersForTab: () => Sticker[];
  getStickerById: (id: string) => Sticker | undefined;
}

const StickerContext = createContext<StickerContextValue | null>(null);

export function StickerProvider({
  children,
  onSendSticker,
}: {
  children: React.ReactNode;
  onSendSticker?: (sticker: Sticker) => void;
}) {
  const [stickerState, setStickerState] = useState<StickerStateType>('idle');
  const [panelOpen, setPanelOpenState] = useState(false);
  const [packs] = useState<StickerPack[]>(defaultStickerPacks);
  const [activePackId, setActivePackId] = useState<string | null>(defaultStickerPacks[0]?.id ?? null);
  const [tab, setTab] = useState<StickerTab>('packs');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentStickerIds, setRecentStickerIds] = useState<string[]>(getStoredRecent);
  const [favoriteStickerIds, setFavoriteStickerIds] = useState<string[]>(getStoredFavorites);

  const openPanel = useCallback(() => {
    setPanelOpenState(true);
    setStickerState('panel_open');
    setSearchQuery('');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpenState(false);
    setStickerState('idle');
    setSearchQuery('');
  }, []);

  const addToRecent = useCallback((stickerId: string) => {
    setRecentStickerIds((prev) => {
      const next = [stickerId, ...prev.filter((id) => id !== stickerId)].slice(0, 30);
      setStoredRecent(next);
      return next;
    });
  }, []);

  const addToFavorites = useCallback((stickerId: string) => {
    setFavoriteStickerIds((prev) => {
      if (prev.includes(stickerId)) return prev;
      const next = [...prev, stickerId];
      setStoredFavorites(next);
      return next;
    });
  }, []);

  const removeFromFavorites = useCallback((stickerId: string) => {
    setFavoriteStickerIds((prev) => {
      const next = prev.filter((id) => id !== stickerId);
      setStoredFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (stickerId: string) => favoriteStickerIds.includes(stickerId),
    [favoriteStickerIds]
  );

  const getStickerById = useCallback(
    (id: string) => findStickerById(packs, id),
    [packs]
  );

  const sendSticker = useCallback(
    (stickerId: string) => {
      const sticker = findStickerById(packs, stickerId);
      if (!sticker) return;
      setStickerState('sending');
      addToRecent(stickerId);
      onSendSticker?.(sticker);
      closePanel();
      setStickerState('idle');
    },
    [packs, addToRecent, onSendSticker, closePanel]
  );

  const getStickersForTab = useCallback(() => {
    if (searchQuery.trim()) {
      return searchStickers(packs, searchQuery);
    }
    if (tab === 'recent') {
      return recentStickerIds
        .map((id) => findStickerById(packs, id))
        .filter((s): s is Sticker => s != null);
    }
    if (tab === 'favorites') {
      return favoriteStickerIds
        .map((id) => findStickerById(packs, id))
        .filter((s): s is Sticker => s != null);
    }
    const pack = packs.find((p) => p.id === activePackId);
    return pack?.stickers ?? [];
  }, [tab, activePackId, packs, searchQuery, recentStickerIds, favoriteStickerIds]);

  const value = useMemo<StickerContextValue>(
    () => ({
      stickerState,
      panelOpen,
      openPanel,
      closePanel,
      setStickerState,
      packs,
      activePackId,
      setActivePackId,
      tab,
      setTab,
      searchQuery,
      setSearchQuery,
      recentStickerIds,
      favoriteStickerIds,
      addToRecent,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      sendSticker,
      onSendSticker,
      getStickersForTab,
      getStickerById,
    }),
    [
      stickerState,
      panelOpen,
      openPanel,
      closePanel,
      packs,
      activePackId,
      tab,
      searchQuery,
      recentStickerIds,
      favoriteStickerIds,
      addToRecent,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      sendSticker,
      onSendSticker,
      getStickersForTab,
      getStickerById,
    ]
  );

  return (
    <StickerContext.Provider value={value}>
      {children}
    </StickerContext.Provider>
  );
}

export function useStickers() {
  const ctx = useContext(StickerContext);
  if (!ctx) throw new Error('useStickers must be used within StickerProvider');
  return ctx;
}
