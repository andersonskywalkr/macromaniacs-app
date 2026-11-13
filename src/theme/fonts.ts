import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

// Plus Jakarta Sans (fonte do protótipo). No React Native, cada peso de uma
// fonte customizada é um arquivo e um nome de família próprio: `fontWeight`
// sozinho não troca o arquivo em todas as plataformas. Por isso os estilos
// usam fontFamily(peso) e NÃO usam fontWeight.
//
// Os arquivos TTF vêm dentro do pacote @expo-google-fonts/plus-jakarta-sans
// (funciona offline).

export type FontWeight = 400 | 500 | 600 | 700 | 800;

export const FONT_FAMILY_BY_WEIGHT: Record<FontWeight, string> = {
  400: 'PlusJakartaSans_400Regular',
  500: 'PlusJakartaSans_500Medium',
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
};

// Nome da família para o peso pedido. Peso fora da lista vai para o mais
// próximo disponível (ex.: 300 -> 400, 900 -> 800).
export function fontFamily(weight: FontWeight | number = 400): string {
  if (weight in FONT_FAMILY_BY_WEIGHT) return FONT_FAMILY_BY_WEIGHT[weight as FontWeight];
  const weights = Object.keys(FONT_FAMILY_BY_WEIGHT).map(Number) as FontWeight[];
  const closest = weights.reduce((best, current) =>
    Math.abs(current - weight) < Math.abs(best - weight) ? current : best,
  );
  return FONT_FAMILY_BY_WEIGHT[closest];
}

// Arquivos entregues ao useFonts (nome da família -> TTF).
export const FONT_FILES = {
  [FONT_FAMILY_BY_WEIGHT[400]]: PlusJakartaSans_400Regular,
  [FONT_FAMILY_BY_WEIGHT[500]]: PlusJakartaSans_500Medium,
  [FONT_FAMILY_BY_WEIGHT[600]]: PlusJakartaSans_600SemiBold,
  [FONT_FAMILY_BY_WEIGHT[700]]: PlusJakartaSans_700Bold,
  [FONT_FAMILY_BY_WEIGHT[800]]: PlusJakartaSans_800ExtraBold,
};

// Tempo máximo (ms) que o app segura a abertura esperando a fonte.
export const FONT_LOAD_TIMEOUT_MS = 3000;
