import { Appearance } from 'react-native';
import { colors, type ThemeMode } from './tokens';

// Barras do sistema (status e navegação) a partir do TEMA DO APP — nunca do
// tema do sistema. Regras:
//   fundo do app CLARO  -> ícones/botões ESCUROS
//   fundo do app ESCURO -> ícones/botões CLAROS
//
// Por que não "auto": no expo-status-bar, style="auto" segue o tema do SISTEMA.
// Quem escolheu Claro/Escuro no Perfil com o sistema no outro tema ficava com
// ícones claros sobre fundo claro (ou escuros sobre escuro). Escuro só parecia
// certo quando o sistema também estava escuro (coincidência).

export type ThemePreference = 'light' | 'dark' | 'system';

// Cor dos ícones/botões, no mesmo sentido do expo-status-bar: 'dark' = ícones
// escuros (para fundo claro); 'light' = ícones claros (para fundo escuro).
export type BarContentStyle = 'light' | 'dark';

export interface SystemBarsStyle {
  statusBarStyle: BarContentStyle;
  // Botões da barra de navegação. Aplicados pelo expo-navigation-bar (ainda
  // não instalado: ver relatório); o valor já fica decidido aqui, num lugar só.
  navigationBarStyle: BarContentStyle;
  // Cor atrás das barras (com edge-to-edge o app desenha por baixo delas).
  backgroundColor: string;
}

export function getSystemBarsStyle(mode: ThemeMode): SystemBarsStyle {
  const content: BarContentStyle = mode === 'dark' ? 'light' : 'dark';
  return {
    statusBarStyle: content,
    navigationBarStyle: content,
    backgroundColor: colors[mode].background,
  };
}

// Tema final do app: a preferência escolhida; em "Automático", o do sistema.
// 'unspecified' ou nulo (o sistema não informa) contam como claro.
export function resolveThemeMode(
  preference: ThemePreference,
  systemScheme: 'light' | 'dark' | 'unspecified' | null | undefined,
): ThemeMode {
  if (preference === 'light' || preference === 'dark') return preference;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

// Esquema nativo que o app pede ao Android/iOS: o tema escolhido, ou 'unspecified'
// para "seguir o sistema" (no Android vira AppCompatDelegate MODE_NIGHT_YES/NO/FOLLOW_SYSTEM). Assim os botões da barra de navegação, os diálogos do
// sistema e o teclado acompanham o tema do APP (e não só o do sistema).
export function nativeColorSchemeFor(preference: ThemePreference): 'light' | 'dark' | 'unspecified' {
  return preference === 'system' ? 'unspecified' : preference;
}

export function syncNativeColorScheme(preference: ThemePreference): void {
  try {
    Appearance.setColorScheme(nativeColorSchemeFor(preference));
  } catch {
    // ambiente sem módulo nativo (testes, web): segue só com o estilo explícito
  }
}
