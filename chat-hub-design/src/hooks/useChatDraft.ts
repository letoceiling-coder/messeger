import { useState, useEffect, useCallback, useRef } from 'react';

const DRAFT_KEY_PREFIX = 'chat-draft-';
const DEBOUNCE_MS = 300;

function getStorageKey(chatId: string, threadId?: string): string {
  const key = threadId ? `${chatId}-${threadId}` : chatId;
  return `${DRAFT_KEY_PREFIX}${key}`;
}

function loadDraft(chatId: string, threadId?: string): string {
  if (!chatId) return '';
  try {
    const raw = localStorage.getItem(getStorageKey(chatId, threadId));
    return raw ?? '';
  } catch {
    return '';
  }
}

function saveDraft(chatId: string, value: string, threadId?: string): void {
  if (!chatId) return;
  try {
    const key = getStorageKey(chatId, threadId);
    if (value.trim()) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

const THREAD_SEP = '::';

export function useChatDraft(
  chatId: string | undefined,
  threadId?: string
): [string, (value: string | ((prev: string) => string)) => void, () => void] {
  const id = chatId ? (threadId ? `${chatId}${THREAD_SEP}${threadId}` : chatId) : '';
  const [value, setValue] = useState(() => {
    if (!id) return '';
    const [cId, tId] = id.includes(THREAD_SEP) ? id.split(THREAD_SEP) : [id, undefined];
    return loadDraft(cId, tId);
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevChatIdRef = useRef(id);
  const valueRef = useRef(value);
  valueRef.current = value;

  // При смене чата: сохранить в старый чат, загрузить черновик нового
  useEffect(() => {
    if (prevChatIdRef.current !== id) {
      const prevId = prevChatIdRef.current;
      const v = valueRef.current;
      if (prevId && v) {
        const [cId, tId] = prevId.includes(THREAD_SEP) ? prevId.split(THREAD_SEP) : [prevId, undefined];
        saveDraft(cId, v, tId);
      }
      prevChatIdRef.current = id;
      const [cId, tId] = id.includes(THREAD_SEP) ? id.split(THREAD_SEP) : [id, undefined];
      setValue(loadDraft(cId || id, tId));
    }
  }, [id]);

  // Сохранять черновик при изменении value с debounce
  useEffect(() => {
    if (!id) return;
    const [cId, tId] = id.includes(THREAD_SEP) ? id.split(THREAD_SEP) : [id, undefined];
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveDraft(cId || id, value, tId);
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [id, value]);

  const clearDraft = useCallback(() => {
    if (id) {
      try {
        const [cId, tId] = id.includes(THREAD_SEP) ? id.split(THREAD_SEP) : [id, undefined];
        localStorage.removeItem(getStorageKey(cId || id, tId));
      } catch {
        /* ignore */
      }
    }
    setValue('');
  }, [id]);

  return [value, setValue, clearDraft];
}

/** Получить черновик чата для отображения в списке (только основной чат, без постов/комментариев) */
export function getDraftForChat(chatId: string): string {
  if (!chatId) return '';
  try {
    const key = `${DRAFT_KEY_PREFIX}${chatId}`;
    const raw = localStorage.getItem(key);
    return raw?.trim() ?? '';
  } catch {
    return '';
  }
}
