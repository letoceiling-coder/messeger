/**
 * Утилиты для работы с темами
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {Theme} from '@types/index';

const THEME_KEY = 'app_theme';

/**
 * Получить сохранённую тему
 */
export const getStoredTheme = async (): Promise<Theme> => {
  try {
    const stored = await AsyncStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch (error) {
    console.error('Error getting stored theme:', error);
  }
  return 'dark'; // По умолчанию
};

/**
 * Сохранить тему
 */
export const saveTheme = async (theme: Theme): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.error('Error saving theme:', error);
  }
};

/**
 * Инициализация темы при запуске
 */
export const initializeTheme = async (): Promise<Theme> => {
  const theme = await getStoredTheme();
  return theme;
};
