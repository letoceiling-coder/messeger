/**
 * Утилиты для работы с датами
 */

import {format, formatDistanceToNow, isToday, isYesterday, parseISO} from 'date-fns';
import {ru} from 'date-fns/locale';

/**
 * Форматировать дату для списка чатов
 * Сегодня: "12:34"
 * Вчера: "Вчера"
 * Старше: "15 янв"
 */
export const formatChatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    
    if (isYesterday(date)) {
      return 'Вчера';
    }
    
    return format(date, 'd MMM', {locale: ru});
  } catch (error) {
    return '';
  }
};

/**
 * Форматировать дату для сообщений
 * "Сегодня", "Вчера", "15 января 2026"
 */
export const formatMessageDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return 'Сегодня';
    }
    
    if (isYesterday(date)) {
      return 'Вчера';
    }
    
    return format(date, 'd MMMM yyyy', {locale: ru});
  } catch (error) {
    return '';
  }
};

/**
 * Форматировать время сообщения
 * "12:34"
 */
export const formatMessageTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'HH:mm');
  } catch (error) {
    return '';
  }
};

/**
 * Форматировать относительное время
 * "2 минуты назад", "1 час назад", "3 дня назад"
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, {locale: ru, addSuffix: true});
  } catch (error) {
    return '';
  }
};

/**
 * Форматировать размер файла
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Б';
  
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
};
