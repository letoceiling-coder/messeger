import React, {createContext, useState, useContext, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useColorScheme} from 'react-native';
import {Theme} from '@types/index';

interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  success: string;
  error: string;
}

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

const darkColors: ThemeColors = {
  background: '#0b0b0b',
  surface: '#1c1c1e',
  surfaceHover: '#2d2d2f',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#ffffff',
  textSecondary: '#86868a',
  accent: '#0a84ff',
  accentHover: '#0077ed',
  success: '#30d158',
  error: '#ff453a',
};

const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#f2f2f7',
  surfaceHover: '#e5e5ea',
  border: 'rgba(0, 0, 0, 0.1)',
  text: '#000000',
  textSecondary: '#8e8e93',
  accent: '#007aff',
  accentHover: '#0051d5',
  success: '#34c759',
  error: '#ff3b30',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({children}: {children: ReactNode}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme) {
        setThemeState(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Ошибка загрузки темы:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem('app_theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Ошибка сохранения темы:', error);
    }
  };

  const resolvedTheme = theme === 'system' ? systemColorScheme || 'dark' : theme;
  const isDark = resolvedTheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{theme, colors, isDark, setTheme}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme должен использоваться внутри ThemeProvider');
  }
  return context;
};
