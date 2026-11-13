import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { v1 } from './paths';
import { mockFoods } from '@/mocks/data';
import { unwrapItems, type Paginated } from './adapters/common';
import { fromApiFood, toApiManualFood, type ApiFood } from './adapters/foods';
import { ApiError } from './ApiError';
import { rankSuggestions, SUGGESTION_LIMIT } from '@/utils/foodSuggestions';
import type { FoodItem } from './types/domain';

// Ignora maiúsculas e acentos na busca do mock ("feijao" acha "Feijão").
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Tamanho da página de resultados da busca.
const FOODS_PAGE_LIMIT = 20;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

export interface SearchFoodsOptions {
  // false = só alimentos já guardados no banco (sem consultar o Open Food
  // Facts, que tem limite de 10 consultas por minuto). Omitido = busca completa.
  external?: boolean;
  limit?: number;
  signal?: AbortSignal;
}

// GET /v1/foods?q= (2 a 100 letras; a tela bloqueia busca menor) — seção 51.
// Sem paginação (o `meta` não foi confirmado): lê só `items` da primeira página.
// A busca completa NÃO manda `external` (o padrão do backend é consultar as
// fontes externas); só as sugestões mandam external=false.
// IMPORTANTE (seção 28/108): a busca completa só dispara por botão — nunca a
// cada tecla, por causa do limite de 10 req/min do Open Food Facts.
export async function searchFoods(
  query: string,
  options: SearchFoodsOptions = {},
): Promise<FoodItem[]> {
  if (USE_MOCK) {
    const term = normalize(query.trim());
    // O limite vale para a requisição real; no mock, suggestFoods reordena e
    // só depois corta em 8 (assim a melhor sugestão não fica de fora).
    const filtered = mockFoods.filter((f) => normalize(`${f.name} ${f.brand ?? ''}`).includes(term));
    return delay(filtered);
  }
  const { data } = await httpClient.get<Paginated<ApiFood> | ApiFood[]>(v1('/foods'), {
    params: {
      q: query.trim(),
      limit: options.limit ?? FOODS_PAGE_LIMIT,
      ...(options.external === false ? { external: false } : {}),
    },
    signal: options.signal,
  });
  return unwrapItems(data).map(fromApiFood);
}

// Sugestões da busca: até 8, só do banco (external=false), reordenadas
// (começa com o texto, depois palavra que começa, depois o resto).
export async function suggestFoods(query: string, signal?: AbortSignal): Promise<FoodItem[]> {
  const foods = await searchFoods(query, { external: false, limit: SUGGESTION_LIMIT, signal });
  return rankSuggestions(foods, query, SUGGESTION_LIMIT);
}

// GET /v1/foods/barcode/:barcode — seção 51
export async function getFoodByBarcode(barcode: string): Promise<FoodItem | null> {
  if (USE_MOCK) {
    return delay(mockFoods.find((f) => f.barcode === barcode) ?? null);
  }
  try {
    const { data } = await httpClient.get<ApiFood>(v1(`/foods/barcode/${barcode}`));
    return fromApiFood(data);
  } catch (error) {
    // Código sem cadastro: o contrato da função é devolver null.
    if (error instanceof ApiError && error.statusCode === 404) return null;
    throw error;
  }
}

// POST /v1/foods/manual — seção 51. O backend não tem marca: ela é juntada ao
// nome (ver adapters/foods.ts).
export async function createManualFood(
  input: Omit<FoodItem, 'id' | 'source' | 'externalId'>,
): Promise<FoodItem> {
  if (USE_MOCK) {
    const created: FoodItem = {
      ...input,
      id: `manual-${Date.now()}`,
      source: 'MANUAL',
      externalId: null,
    };
    // Guarda no mock pra o alimento aparecer nas próximas buscas, como no
    // backend real.
    mockFoods.push(created);
    return delay(created);
  }
  const { data } = await httpClient.post<ApiFood>(v1('/foods/manual'), toApiManualFood(input));
  return fromApiFood(data);
}
