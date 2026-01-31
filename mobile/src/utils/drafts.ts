/**
 * Утилиты для работы с черновиками сообщений
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFTS_KEY = 'chat_drafts';

interface Draft {
  text: string;
  timestamp: number;
}

/**
 * Получить все черновики
 */
export const getAllDrafts = async (): Promise<Record<string, Draft>> => {
  try {
    const stored = await AsyncStorage.getItem(DRAFTS_KEY);
    if (stored) {
      const drafts = JSON.parse(stored) as Record<string, Draft>;
      
      // Очистить старые черновики (>7 дней)
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const filtered: Record<string, Draft> = {};
      
      for (const [chatId, draft] of Object.entries(drafts)) {
        if (now - draft.timestamp < sevenDays) {
          filtered[chatId] = draft;
        }
      }
      
      return filtered;
    }
  } catch (error) {
    console.error('Error getting drafts:', error);
  }
  return {};
};

/**
 * Сохранить черновик
 */
export const saveDraft = async (chatId: string, text: string): Promise<void> => {
  try {
    if (!text.trim()) {
      await deleteDraft(chatId);
      return;
    }
    
    const drafts = await getAllDrafts();
    drafts[chatId] = {
      text,
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error('Error saving draft:', error);
  }
};

/**
 * Получить черновик для чата
 */
export const getDraft = async (chatId: string): Promise<string | null> => {
  try {
    const drafts = await getAllDrafts();
    return drafts[chatId]?.text || null;
  } catch (error) {
    console.error('Error getting draft:', error);
    return null;
  }
};

/**
 * Удалить черновик
 */
export const deleteDraft = async (chatId: string): Promise<void> => {
  try {
    const drafts = await getAllDrafts();
    delete drafts[chatId];
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error('Error deleting draft:', error);
  }
};

/**
 * Проверить наличие черновика
 */
export const hasDraft = async (chatId: string): Promise<boolean> => {
  try {
    const drafts = await getAllDrafts();
    return !!drafts[chatId];
  } catch (error) {
    console.error('Error checking draft:', error);
    return false;
  }
};
