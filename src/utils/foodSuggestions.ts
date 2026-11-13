import type { FoodItem } from '@/api/types/domain';

// Sugestões rápidas da busca de alimento (guia rápida enquanto digita).

export const SUGGESTION_MIN_LENGTH = 2;
export const SUGGESTION_MAX_LENGTH = 100;
export const SUGGESTION_LIMIT = 8;
export const SUGGESTION_DEBOUNCE_MS = 300;

// Um caractere vira UM caractere (minúsculo, sem acento): assim a posição no
// texto normalizado é a mesma posição no original (necessário para o destaque).
function normalizeChar(char: string): string {
  const base = char.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return base.length === 1 ? base : char.toLowerCase().slice(0, 1) || char;
}

// Minúsculas e sem acento, mantendo o tamanho do texto.
export function normalizeText(text: string): string {
  return Array.from(text).map(normalizeChar).join('');
}

// O texto digitado vale como sugestão a partir de 2 e até 100 caracteres.
export function isSuggestionQuery(query: string): boolean {
  const length = query.trim().length;
  return length >= SUGGESTION_MIN_LENGTH && length <= SUGGESTION_MAX_LENGTH;
}

// 0 = nome começa com o texto; 1 = alguma palavra do nome começa com o texto;
// 2 = o resto.
export function suggestionGroup(name: string, query: string): 0 | 1 | 2 {
  const normalizedName = normalizeText(name);
  const normalizedQuery = normalizeText(query.trim());
  if (normalizedName.startsWith(normalizedQuery)) return 0;
  const words = normalizedName.split(/[^a-z0-9]+/).filter(Boolean);
  if (words.some((word) => word.startsWith(normalizedQuery))) return 1;
  return 2;
}

// Reordena SEM trocar a ordem entre itens do mesmo grupo (ordenação estável).
export function rankSuggestions(foods: FoodItem[], query: string, limit = SUGGESTION_LIMIT): FoodItem[] {
  const groups: FoodItem[][] = [[], [], []];
  for (const food of foods) groups[suggestionGroup(food.name, query)].push(food);
  return groups.flat().slice(0, limit);
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

// Divide o nome no trecho digitado (sem diferenciar maiúsculas e acentos)
// para destacá-lo em negrito. Sem trecho encontrado, o nome inteiro sem destaque.
export function splitHighlight(name: string, query: string): HighlightSegment[] {
  const normalizedQuery = normalizeText(query.trim());
  if (!normalizedQuery) return [{ text: name, match: false }];

  const chars = Array.from(name);
  const normalizedName = chars.map(normalizeChar).join('');
  const index = normalizedName.indexOf(normalizedQuery);
  if (index < 0) return [{ text: name, match: false }];

  const end = index + Array.from(normalizedQuery).length;
  const segments: HighlightSegment[] = [
    { text: chars.slice(0, index).join(''), match: false },
    { text: chars.slice(index, end).join(''), match: true },
    { text: chars.slice(end).join(''), match: false },
  ];
  return segments.filter((segment) => segment.text.length > 0);
}
