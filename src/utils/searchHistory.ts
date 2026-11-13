import { normalizeText } from './foodSuggestions';

// Histórico de pesquisa de alimentos: até 10, mais recente primeiro, sem
// repetição (ignora maiúsculas e acentos) e com pelo menos 2 caracteres.

export const HISTORY_LIMIT = 10;
export const HISTORY_MIN_LENGTH = 2;

function sameTerm(a: string, b: string): boolean {
  return normalizeText(a.trim()) === normalizeText(b.trim());
}

// Devolve uma lista nova com o termo no topo. Repetir move o item para o topo
// (com a grafia mais recente).
export function addToHistory(items: string[], term: string, limit = HISTORY_LIMIT): string[] {
  const clean = term.trim().replace(/\s+/g, ' ');
  if (clean.length < HISTORY_MIN_LENGTH) return items;
  return [clean, ...items.filter((item) => !sameTerm(item, clean))].slice(0, limit);
}

export function removeFromHistory(items: string[], term: string): string[] {
  return items.filter((item) => !sameTerm(item, term));
}

// Chave por usuário: o histórico não mistura contas no mesmo aparelho.
export function historyStorageKey(userId: string): string {
  return `macromaniacs:food-search-history:${userId}`;
}

// Lê o que estava guardado, ignorando lixo.
export function parseStoredHistory(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string')
      .reduce<string[]>((list, item) => [...list, ...(list.some((x) => sameTerm(x, item)) ? [] : [item])], [])
      .slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}
