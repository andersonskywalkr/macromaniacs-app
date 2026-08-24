import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Appearance } from 'react-native';
import { colors, ColorTokens, ThemeMode } from './tokens';
import { useThemeStore } from '@/store/themeStore';

interface ThemeContextValue {
  mode: ThemeMode;
  tokens: ColorTokens;
  setMode: (mode: ThemeMode | 'system') => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Resolve o tema final combinando:
 *   Appearance.getColorScheme() (tema do sistema)
 *   + preferência manual do usuário (alternador na Home)
 * conforme seção 121.2 do documento.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preference = useThemeStore((s) => s.preference); // 'light' | 'dark' | 'system'
  const systemScheme = Appearance.getColorScheme() ?? 'light';

  const resolvedMode: ThemeMode = preference === 'system' ? systemScheme : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode: resolvedMode,
      tokens: colors[resolvedMode],
      setMode: useThemeStore.getState().setPreference,
    }),
    [resolvedMode],
  );

  // Re-renderiza se o usuário mudar o tema do SO enquanto o preference é 'system'
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      if (useThemeStore.getState().preference === 'system') {
        useThemeStore.setState({}); // força recomputo dos seletores
      }
    });
    return () => sub.remove();
  }, []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme precisa ser usado dentro de <ThemeProvider>');
  }
  return ctx;
}
