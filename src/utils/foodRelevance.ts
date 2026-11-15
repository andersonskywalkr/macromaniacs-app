import type { FoodItem } from '@/api/types/domain';

// Relevância dos resultados da busca de alimentos, calculada NO APP.
//
// O backend ordena a lista por nome (LIKE %q% ORDER BY name), sem relevância.
// Este módulo só REORDENA o que já foi carregado: se o alimento certo não veio
// no conjunto (50 itens por página), ele não aparece no topo. A correção
// definitiva (ordenar por relevância na própria consulta) depende do back.

// ---- Ajustes num só lugar ---------------------------------------------------

// Palavras que indicam produto industrializado/derivado ("salgadinho sabor
// frango grelhado", "molho de tomate"). Penalizam quando a consulta NÃO as tem.
export const FLAVOR_WORDS: readonly string[] = [
  'sabor',
  'sabores',
  'tempero',
  'temperado',
  'temperada',
  'molho',
  'snack',
  'snacks',
  'salgadinho',
  'chips',
  'chip',
];

// Conectores de prato composto ("arroz COM frango", "feijão E arroz").
export const COMPOSITE_WORDS: readonly string[] = ['com', 'e'];

// Só penaliza quando a consulta é um alimento simples (poucas palavras).
export const SIMPLE_QUERY_MAX_WORDS = 3;

export const PENALTY_PER_WORD = 40;
export const MAX_PENALTY = 120;

// Pontos de cada nível de relevância (maior = mais relevante).
export const SCORE = {
  exact: 1000,
  startsWithWord: 800,
  startsWithPrefix: 750,
  allWords: 600,
  substring: 400,
  other: 200,
} as const;

// ---- Texto -------------------------------------------------------------------

// Minúsculas, sem acento e sem pontuação; espaços repetidos viram um só.
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function words(normalized: string): string[] {
  return normalized.split(' ').filter(Boolean);
}

// "Frango grelhado (Marca X)" -> "Frango grelhado": a marca entre parênteses
// não deve impedir o nome de contar como igual à consulta.
function withoutBrandSuffix(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '');
}

// ---- Pontuação ---------------------------------------------------------------

function baseScore(name: string, queryNormalized: string, queryWords: string[]): number {
  const nameNormalized = normalizeForSearch(name);
  const coreNormalized = normalizeForSearch(withoutBrandSuffix(name));

  if (nameNormalized === queryNormalized || coreNormalized === queryNormalized) return SCORE.exact;

  const nameWords = words(nameNormalized);

  if (nameNormalized.startsWith(queryNormalized)) {
    const boundary = nameNormalized.length === queryNormalized.length || nameNormalized[queryNormalized.length] === ' ';
    return boundary ? SCORE.startsWithWord : SCORE.startsWithPrefix;
  }

  const positions = queryWords.map((term) => nameWords.indexOf(term));
  if (queryWords.length > 0 && positions.every((position) => position >= 0)) {
    // Bônus de até 50 pontos quando os termos aparecem logo no início do nome.
    const first = Math.min(...positions);
    return SCORE.allWords + Math.max(0, 50 - first * 10);
  }

  if (nameNormalized.includes(queryNormalized)) return SCORE.substring;

  // Demais casos: um pouco mais para quem acerta pelo menos o começo de alguma palavra.
  const partial = queryWords.filter((term) => nameWords.some((word) => word.startsWith(term))).length;
  return SCORE.other + partial * 10;
}

function penalty(name: string, queryWords: string[]): number {
  if (queryWords.length === 0 || queryWords.length > SIMPLE_QUERY_MAX_WORDS) return 0;

  const queryHas = (list: readonly string[]) => list.some((word) => queryWords.includes(word));
  if (queryHas(FLAVOR_WORDS) || queryHas(COMPOSITE_WORDS)) return 0;

  const nameWords = words(normalizeForSearch(name));
  const hits =
    nameWords.filter((word) => FLAVOR_WORDS.includes(word)).length +
    nameWords.filter((word) => COMPOSITE_WORDS.includes(word)).length;
  return Math.min(MAX_PENALTY, hits * PENALTY_PER_WORD);
}

// Pontuação final do nome para a consulta (maior = mais relevante).
export function scoreFoodName(name: string, query: string): number {
  const queryNormalized = normalizeForSearch(query);
  const queryWords = words(queryNormalized);
  if (queryNormalized === '') return 0;
  return baseScore(name, queryNormalized, queryWords) - penalty(name, queryWords);
}

// Ordena por relevância. Desempate: nome mais curto primeiro, depois ordem
// alfabética e, por fim, a ordem original (ordenação estável). Não altera a
// lista recebida.
export function rankFoodsByRelevance<T extends Pick<FoodItem, 'name'>>(foods: readonly T[], query: string): T[] {
  return foods
    .map((food, index) => ({ food, index, score: scoreFoodName(food.name, query) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.food.name.length !== b.food.name.length) return a.food.name.length - b.food.name.length;
      const alphabetical = a.food.name.localeCompare(b.food.name, 'pt-BR');
      return alphabetical !== 0 ? alphabetical : a.index - b.index;
    })
    .map((entry) => entry.food);
}
