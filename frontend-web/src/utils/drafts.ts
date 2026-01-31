/**
 * Утилиты для работы с черновиками сообщений
 */

const DRAFTS_KEY = 'chat_drafts';

interface Draft {
  text: string;
  timestamp: number;
}

/**
 * Получить все черновики
 */
export const getAllDrafts = (): Record<string, Draft> => {
  try {
    const stored = localStorage.getItem(DRAFTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Сохранить черновик для чата
 */
export const saveDraft = (chatId: string, text: string): void => {
  try {
    const drafts = getAllDrafts();
    
    if (text.trim()) {
      drafts[chatId] = {
        text: text.trim(),
        timestamp: Date.now(),
      };
    } else {
      // Если текст пустой, удаляем черновик
      delete drafts[chatId];
    }
    
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error('Ошибка сохранения черновика:', error);
  }
};

/**
 * Получить черновик для чата
 */
export const getDraft = (chatId: string): string | null => {
  try {
    const drafts = getAllDrafts();
    const draft = drafts[chatId];
    
    if (!draft) return null;
    
    // Удаляем старые черновики (старше 7 дней)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (draft.timestamp < sevenDaysAgo) {
      deleteDraft(chatId);
      return null;
    }
    
    return draft.text;
  } catch {
    return null;
  }
};

/**
 * Удалить черновик для чата
 */
export const deleteDraft = (chatId: string): void => {
  try {
    const drafts = getAllDrafts();
    delete drafts[chatId];
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error('Ошибка удаления черновика:', error);
  }
};

/**
 * Проверить, есть ли черновик для чата
 */
export const hasDraft = (chatId: string): boolean => {
  const draft = getDraft(chatId);
  return draft !== null && draft.length > 0;
};
