import { DefaultTheme, DarkTheme, type Theme } from '@react-navigation/native';
import type { ColorTokens, ThemeMode } from '@/theme/tokens';

// Tema do React Navigation a partir dos tokens do app. Sem isto, o fundo padrão
// da navegação é cinza-claro fixo e aparece como faixa clara (flash) atrás das
// telas e nas transições quando o app está no tema escuro.
export function buildNavigationTheme(mode: ThemeMode, tokens: ColorTokens): Theme {
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: mode === 'dark',
    colors: {
      ...base.colors,
      primary: tokens.primary,
      background: tokens.background,
      card: tokens.background,
      text: tokens.text,
      border: tokens.card,
      notification: tokens.primary,
    },
  };
}
