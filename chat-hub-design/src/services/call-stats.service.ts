/**
 * История звонков — хранится в localStorage (ключ: messager_call_stats).
 * Совместим с frontend-web.
 */

export interface CallRecord {
  id: string;
  chatId: string;
  contactName?: string;
  durationSeconds: number;
  isVideo: boolean;
  endedAt: string;
}

const STORAGE_KEY = 'messager_call_stats';
const MAX_RECORDS = 500;

function loadRecords(): CallRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveRecords(records: CallRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-MAX_RECORDS)));
  } catch {
    // ignore
  }
}

export const callStatsService = {
  saveCall(chatId: string, durationSeconds: number, isVideo: boolean, contactName?: string) {
    if (durationSeconds < 0) return;
    const records = loadRecords();
    records.push({
      id: crypto.randomUUID?.() ?? `call-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      chatId,
      contactName,
      durationSeconds: Math.floor(durationSeconds),
      isVideo,
      endedAt: new Date().toISOString(),
    });
    saveRecords(records);
  },

  getCallHistory(): CallRecord[] {
    return loadRecords().reverse();
  },
};
