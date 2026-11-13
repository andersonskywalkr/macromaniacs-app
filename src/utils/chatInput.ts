// Campo de mensagem do chat, no estilo do WhatsApp: cresce com o texto até
// ~5 linhas; passando disso para de crescer e rola por dentro.

export const CHAT_INPUT_LINE_HEIGHT = 20;
export const CHAT_INPUT_MAX_LINES = 5;
export const CHAT_INPUT_MIN_HEIGHT = CHAT_INPUT_LINE_HEIGHT; // uma linha
export const CHAT_INPUT_MAX_HEIGHT = CHAT_INPUT_LINE_HEIGHT * CHAT_INPUT_MAX_LINES;

// Altura do campo a partir da altura do conteúdo (onContentSizeChange),
// entre uma linha e o máximo.
export function clampInputHeight(contentHeight: number): number {
  if (!Number.isFinite(contentHeight)) return CHAT_INPUT_MIN_HEIGHT;
  return Math.round(Math.min(CHAT_INPUT_MAX_HEIGHT, Math.max(CHAT_INPUT_MIN_HEIGHT, contentHeight)));
}

// Passou do limite: o campo para de crescer e o texto rola por dentro
// (mantendo o cursor à vista). Folga de 1 px contra arredondamento.
export function isInputScrollable(contentHeight: number): boolean {
  return contentHeight > CHAT_INPUT_MAX_HEIGHT + 1;
}

export interface ScrollMetrics {
  offsetY: number;
  viewportHeight: number;
  contentHeight: number;
}

// A lista está na última mensagem (ou quase)? Se o usuário rolou para cima
// para ler o histórico, não se força a rolagem para baixo.
export function isNearBottom(
  { offsetY, viewportHeight, contentHeight }: ScrollMetrics,
  threshold = 48,
): boolean {
  return contentHeight - (offsetY + viewportHeight) <= threshold;
}
