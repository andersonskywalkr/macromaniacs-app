/**
 * Tokens de design do MacroManiacs.
 * Fonte: seção 121.1 do Documento de Arquitetura (Capítulo Adicional — Frontend).
 * Não usar valores de cor/espaçamento soltos nos componentes — sempre importar daqui.
 */

export const colors = {
  light: {
    background: '#FFFFFF',
    card: '#F7F6F9',
    text: '#17141F',
    textSecondary: '#6E6880',
    primary: '#5B21B6',
    ring: '#6D28D9',
    // Trilha de anéis/barras de progresso — mais escura que `card` de propósito,
    // pra permanecer visível quando o componente é usado dentro de um Card.
    track: '#E9E6EF',
    // Mensagens de erro/validação (formulários de auth e onboarding).
    danger: '#B42338',
    protein: '#B42338',
    carbs: '#B45309',
    fat: '#15803D',
    water: '#0369A1',
    gold: '#92500A',
  },
  dark: {
    background: '#111015',
    card: '#1C1A22',
    text: '#F5F3F8',
    textSecondary: '#A29CB0',
    primary: '#C4ADF9',
    ring: '#8B5CF6',
    track: '#2E2A38',
    danger: '#F0808F',
    protein: '#F0808F',
    carbs: '#E9A23B',
    fat: '#4EC17A',
    water: '#7DD3FC',
    gold: '#EDB25C',
  },
} as const;

export const radius = {
  card: 28,
} as const;

export const typography = {
  family: 'PlusJakartaSans',
  weights: [500, 600, 700, 800],
} as const;

// Espaçamento base em escala de 4px — não estava explícito no documento,
// mas segue o mesmo princípio de tokens centralizados da seção 5.1 (simplicidade).
// Ajustar aqui se o time definir uma escala diferente no design.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// Alvo mínimo de toque acessível — seção 122.2 (WCAG 2.2)
export const touchTarget = {
  minSize: 44,
} as const;

export type ThemeMode = 'light' | 'dark';
// Amplia os valores de string literal (o `as const` acima) pra `string` —
// senão o TS trava ColorTokens nos hex exatos do tema `light`, e `colors.dark`
// (que tem os mesmos campos, mas valores diferentes) deixa de ser compatível.
export type ColorTokens = { [K in keyof typeof colors.light]: string };
