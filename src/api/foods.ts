import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { v1 } from './paths';
import { mockFoods } from '@/mocks/data';
import { unwrapItems, type Paginated } from './adapters/common';
import { fromApiFood, toApiManualFood, type ApiFood } from './adapters/foods';
import { ApiError } from './ApiError';
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

// GET /v1/foods?q= (2 a 100 letras; a tela bloqueia busca menor) — seção 51.
// Sem paginação (o `meta` não foi confirmado): lê só `items` da primeira página.
// IMPORTANTE (seção 28/108): esta função deve ser chamada só a partir de um
// botão "Buscar" ou debounce >= ~400ms — nunca a cada tecla digitada, por
// causa do limite de 10 req/min do Open Food Facts.
export async function searchFoods(query: string): Promise<FoodItem[]> {
  if (USE_MOCK) {
    const term = normalize(query.trim());
    const filtered = mockFoods.filter((f) =>
      normalize(`${f.name} ${f.brand ?? ''}`).includes(term),
    );
    return delay(filtered);
  }
  const { data } = await httpClient.get<Paginated<ApiFood> | ApiFood[]>(v1('/foods'), {
    params: { q: query.trim(), limit: FOODS_PAGE_LIMIT },
  });
  return unwrapItems(data).map(fromApiFood);
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
