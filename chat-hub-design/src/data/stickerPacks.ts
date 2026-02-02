import type { Sticker, StickerPack } from '@/types/messenger';

// Placeholder: используем data URL с эмодзи-подобным SVG для демо (в проде — CDN URL)
const stickerImage = (emoji: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><rect fill="%23f0f0f0" width="128" height="128" rx="16"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="64">${emoji}</text></svg>`
  )}`;

export const defaultStickerPacks: StickerPack[] = [
  {
    id: 'pack-1',
    title: 'Смайлики',
    iconUrl: stickerImage('😀'),
    stickers: [
      { id: 's1-1', packId: 'pack-1', url: stickerImage('😀'), emoji: '😀', keywords: ['смайл', 'радость'] },
      { id: 's1-2', packId: 'pack-1', url: stickerImage('😂'), emoji: '😂', keywords: ['смех', 'слезы'] },
      { id: 's1-3', packId: 'pack-1', url: stickerImage('😍'), emoji: '😍', keywords: ['любовь', 'сердце'] },
      { id: 's1-4', packId: 'pack-1', url: stickerImage('🤔'), emoji: '🤔', keywords: ['думать', 'вопрос'] },
      { id: 's1-5', packId: 'pack-1', url: stickerImage('👍'), emoji: '👍', keywords: ['ок', 'класс'] },
      { id: 's1-6', packId: 'pack-1', url: stickerImage('❤️'), emoji: '❤️', keywords: ['любовь', 'сердце'] },
      { id: 's1-7', packId: 'pack-1', url: stickerImage('🔥'), emoji: '🔥', keywords: ['огонь', 'круто'] },
      { id: 's1-8', packId: 'pack-1', url: stickerImage('🎉'), emoji: '🎉', keywords: ['праздник', 'ура'] },
      { id: 's1-9', packId: 'pack-1', url: stickerImage('😊'), emoji: '😊', keywords: ['улыбка'] },
      { id: 's1-10', packId: 'pack-1', url: stickerImage('🙏'), emoji: '🙏', keywords: ['спасибо', 'пожалуйста'] },
    ],
  },
  {
    id: 'pack-2',
    title: 'Жесты',
    iconUrl: stickerImage('👍'),
    stickers: [
      { id: 's2-1', packId: 'pack-2', url: stickerImage('👍'), emoji: '👍', keywords: ['ок', 'да'] },
      { id: 's2-2', packId: 'pack-2', url: stickerImage('👎'), emoji: '👎', keywords: ['нет', 'плохо'] },
      { id: 's2-3', packId: 'pack-2', url: stickerImage('👌'), emoji: '👌', keywords: ['отлично'] },
      { id: 's2-4', packId: 'pack-2', url: stickerImage('✌️'), emoji: '✌️', keywords: ['победа'] },
      { id: 's2-5', packId: 'pack-2', url: stickerImage('🤞'), emoji: '🤞', keywords: ['удачи'] },
      { id: 's2-6', packId: 'pack-2', url: stickerImage('🙌'), emoji: '🙌', keywords: ['ура'] },
      { id: 's2-7', packId: 'pack-2', url: stickerImage('👏'), emoji: '👏', keywords: ['аплодисменты'] },
      { id: 's2-8', packId: 'pack-2', url: stickerImage('💪'), emoji: '💪', keywords: ['сила'] },
      { id: 's2-9', packId: 'pack-2', url: stickerImage('🤝'), emoji: '🤝', keywords: ['рукопожатие'] },
      { id: 's2-10', packId: 'pack-2', url: stickerImage('✋'), emoji: '✋', keywords: ['стоп', 'привет'] },
    ],
  },
  {
    id: 'pack-3',
    title: 'Эмоции',
    iconUrl: stickerImage('❤️'),
    stickers: [
      { id: 's3-1', packId: 'pack-3', url: stickerImage('❤️'), emoji: '❤️', keywords: ['любовь'] },
      { id: 's3-2', packId: 'pack-3', url: stickerImage('💔'), emoji: '💔', keywords: ['разбитое сердце'] },
      { id: 's3-3', packId: 'pack-3', url: stickerImage('😢'), emoji: '😢', keywords: ['грусть'] },
      { id: 's3-4', packId: 'pack-3', url: stickerImage('😡'), emoji: '😡', keywords: ['злость'] },
      { id: 's3-5', packId: 'pack-3', url: stickerImage('😴'), emoji: '😴', keywords: ['сон'] },
      { id: 's3-6', packId: 'pack-3', url: stickerImage('🤗'), emoji: '🤗', keywords: ['объятия'] },
      { id: 's3-7', packId: 'pack-3', url: stickerImage('🥳'), emoji: '🥳', keywords: ['праздник'] },
      { id: 's3-8', packId: 'pack-3', url: stickerImage('😎'), emoji: '😎', keywords: ['крутой'] },
      { id: 's3-9', packId: 'pack-3', url: stickerImage('🤩'), emoji: '🤩', keywords: ['вау'] },
      { id: 's3-10', packId: 'pack-3', url: stickerImage('😇'), emoji: '😇', keywords: ['ангел'] },
    ],
  },
];

const RECENT_MAX = 30;
const FAVORITES_KEY = 'sticker-favorites';
const RECENT_KEY = 'sticker-recent';

export function getStoredFavorites(): string[] {
  try {
    const s = localStorage.getItem(FAVORITES_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function setStoredFavorites(ids: string[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {}
}

export function getStoredRecent(): string[] {
  try {
    const s = localStorage.getItem(RECENT_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function setStoredRecent(ids: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, RECENT_MAX)));
  } catch {}
}

export function findStickerById(packs: StickerPack[], id: string): Sticker | undefined {
  for (const pack of packs) {
    const s = pack.stickers.find((st) => st.id === id);
    if (s) return s;
  }
  return undefined;
}

export function searchStickers(packs: StickerPack[], query: string): Sticker[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: Sticker[] = [];
  for (const pack of packs) {
    for (const s of pack.stickers) {
      const match =
        s.emoji?.includes(q) ||
        s.keywords?.some((k) => k.toLowerCase().includes(q));
      if (match) results.push(s);
    }
  }
  return results;
}
