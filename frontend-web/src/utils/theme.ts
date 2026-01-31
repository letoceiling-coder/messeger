/**
 * Утилиты для работы с темами оформления
 */

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'app_theme';

/**
 * Получить текущую тему из localStorage
 */
export const getStoredTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {}
  return 'dark'; // По умолчанию темная тема
};

/**
 * Сохранить выбранную тему
 */
export const saveTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.error('Ошибка сохранения темы:', error);
  }
};

/**
 * Получить системную тему
 */
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return isDark ? 'dark' : 'light';
};

/**
 * Разрешить тему (учитывая системную настройку)
 */
export const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

/**
 * Применить тему к документу
 */
export const applyTheme = (theme: Theme): void => {
  const resolved = resolveTheme(theme);
  
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
};

/**
 * Инициализировать тему при загрузке приложения
 */
export const initializeTheme = (): void => {
  const theme = getStoredTheme();
  applyTheme(theme);
  
  // Слушатель изменения системной темы
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const currentTheme = getStoredTheme();
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
  }
};
