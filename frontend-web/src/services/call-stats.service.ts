/**
 * Статистика звонков: длительность, тип (голос/видео), дата.
 * Хранится в localStorage (ключ: messager_call_stats).
 */

export interface CallRecord {
  id: string;
  chatId: string;
  contactName?: string;
  durationSeconds: number;
  isVideo: boolean;
  endedAt: string; // ISO
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
  } catch (e) {
    console.warn('call-stats save failed', e);
  }
}

export const callStatsService = {
  /** Сохранить завершённый звонок (вызывать при завершении разговора). */
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

  /** История звонков (последние первые). */
  getCallHistory(): CallRecord[] {
    return loadRecords().reverse();
  },

  /** Сводка: количество звонков и общая длительность (сек). */
  getStatsSummary(): { totalCalls: number; totalDurationSeconds: number; videoCalls: number; voiceCalls: number } {
    const records = loadRecords();
    let totalDurationSeconds = 0;
    let videoCalls = 0;
    let voiceCalls = 0;
    records.forEach((r) => {
      totalDurationSeconds += r.durationSeconds;
      if (r.isVideo) videoCalls++;
      else voiceCalls++;
    });
    return {
      totalCalls: records.length,
      totalDurationSeconds,
      videoCalls,
      voiceCalls,
    };
  },
};
