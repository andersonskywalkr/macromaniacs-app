import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors, ColorTokens, ThemeMode } from './tokens';
import { resolveThemeMode, syncNativeColorScheme } from './systemBars';
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
  // useColorScheme() reage à troca do tema do sistema com o app aberto (o
  // listener antigo não re-renderizava). Pode ser 'unspecified' (RN 0.88) ou
  // nulo quando a plataforma não informa: conta como 'light'.
  const systemScheme = useColorScheme();

  const resolvedMode: ThemeMode = resolveThemeMode(preference, systemScheme);

  // O app pede ao sistema o tema escolhido (ou "seguir o sistema"): barra de
  // navegação, diálogos e teclado acompanham o tema do APP.
  useEffect(() => {
    syncNativeColorScheme(preference);
  }, [preference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode: resolvedMode,
      tokens: colors[resolvedMode],
      setMode: useThemeStore.getState().setPreference,
    }),
    [resolvedMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme precisa ser usado dentro de <ThemeProvider>');
  }
  return ctx;
}
