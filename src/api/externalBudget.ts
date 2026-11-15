// Orçamento de consultas às fontes externas (Open Food Facts), que têm limite
// de 10 consultas por minuto. A pesquisa rápida consulta as fontes externas
// enquanto a pessoa digita; este controle garante que o app nunca passe de
// EXTERNAL_CALLS_PER_MINUTE por minuto (abaixo do limite, com folga). Passou
// disso, a pesquisa rápida usa só os alimentos já salvos até liberar a janela.
//
// A busca completa (botão "Buscar") nunca é bloqueada: é uma ação explícita,
// mas conta no orçamento.

export const EXTERNAL_CALLS_PER_MINUTE = 8;
const WINDOW_MS = 60_000;

let calls: number[] = [];

function prune(now: number): void {
  calls = calls.filter((time) => now - time < WINDOW_MS);
}

export function canCallExternal(now: number = Date.now()): boolean {
  prune(now);
  return calls.length < EXTERNAL_CALLS_PER_MINUTE;
}

export function recordExternalCall(now: number = Date.now()): void {
  prune(now);
  calls.push(now);
}

export function resetExternalBudget(): void {
  calls = [];
}
