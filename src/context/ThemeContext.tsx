import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MODERN_DARK, MODERN_LIGHT, THEMES, ThemeMode, ThemePalette } from '../theme';

const STORAGE_KEY = '@kana_path_theme_mode_v2';

type ThemeContextType = {
  theme: ThemePalette;
  themeMode: ThemeMode;
  isDark: boolean;
  isJapanese: boolean;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: MODERN_LIGHT,
  themeMode: 'modern-light',
  isDark: false,
  isJapanese: false,
  setThemeMode: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setMode] = useState<ThemeMode>('modern-light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved && saved in THEMES) {
          setMode(saved as ThemeMode);
        } else if (systemScheme === 'dark') {
          setMode('modern-dark');
        }
      })
      .catch(() => undefined);
  }, [systemScheme]);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    void AsyncStorage.setItem(STORAGE_KEY, newMode).catch(() => undefined);
  }, []);

  const theme = useMemo(() => {
    return THEMES[themeMode] ?? (themeMode.includes('dark') ? MODERN_DARK : MODERN_LIGHT);
  }, [themeMode]);

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      isDark: theme.isDark,
      isJapanese: theme.isJapanese,
      setThemeMode,
    }),
    [theme, themeMode, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
