import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { v1 } from './paths';
import { mockFoods } from '@/mocks/data';
import { unwrapItems, type Paginated, type PaginationMeta } from './adapters/common';
import { fromApiFood, toApiManualFood, type ApiFood } from './adapters/foods';
import { ApiError } from './ApiError';
import { SUGGESTION_LIMIT } from '@/utils/foodSuggestions';
import { rankFoodsByRelevance } from '@/utils/foodRelevance';
import { canCallExternal, recordExternalCall } from './externalBudget';
import type { FoodItem } from './types/domain';

// Ignora maiúsculas e acentos na busca do mock ("feijao" acha "Feijão").
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Tamanho da página de resultados da busca: 50, o máximo aceito pelo backend.
// O backend ordena por nome (sem relevância), então um conjunto maior aumenta a
// chance de o alimento mais relevante vir junto e subir na reordenação feita no
// app (utils/foodRelevance.ts). Todas as páginas usam o MESMO tamanho (a
// paginação do backend é por página: mudar o limite no meio embaralharia os itens).
export const FOODS_PAGE_LIMIT = 50;

// Consultar as fontes externas é mais lento que ler o banco: prazo maior que o
// padrão do cliente (10 s) só nessas requisições.
export const EXTERNAL_SEARCH_TIMEOUT_MS = 25_000;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

export interface SearchFoodsOptions {
  // false = só alimentos já guardados no banco (sem consultar o Open Food
  // Facts, que tem limite de 10 consultas por minuto). true = consulta as
  // fontes externas (e guarda no banco). Omitido = o padrão do backend (busca completa).
  external?: boolean;
  limit?: number;
  signal?: AbortSignal;
  page?: number;
}

export interface FoodSearchPage {
  items: FoodItem[];
  meta: PaginationMeta;
  // As fontes externas estavam indisponíveis (503): o resultado traz só os
  // alimentos já salvos.
  externalUnavailable?: boolean;
}

// GET /v1/foods?q= (2 a 100 letras; a tela bloqueia busca menor) — seção 51.
// A tela consome `items` e `meta` página a página.
// A busca completa NÃO manda `external` (o padrão do backend é consultar as
// fontes externas); só as sugestões mandam external=false.
// IMPORTANTE (seção 28/108): a busca completa só dispara por botão — nunca a
// cada tecla, por causa do limite de 10 req/min do Open Food Facts.
export async function searchFoodsPage(
  query: string,
  options: SearchFoodsOptions = {},
): Promise<FoodSearchPage> {
  if (USE_MOCK) {
    const term = normalize(query.trim());
    // No mock, suggestFoods também pede 50, reordena por relevância e só depois
    // corta em 8 (assim a melhor sugestão não fica de fora).
    const filtered = mockFoods.filter((f) => normalize(`${f.name} ${f.brand ?? ''}`).includes(term));
    const limit = options.limit ?? FOODS_PAGE_LIMIT;
    const page = options.page ?? 1;
    return delay({
      items: filtered.slice((page - 1) * limit, page * limit),
      meta: { page, limit, totalItems: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / limit)) },
    });
  }
  try {
    return await requestFoodsPage(query, options);
  } catch (error) {
    // 503 = provedores externos indisponíveis. Em vez de quebrar a tela, tenta
    // de novo só com os alimentos já salvos e avisa que foi assim.
    if (error instanceof ApiError && error.statusCode === 503 && options.external !== false) {
      const local = await requestFoodsPage(query, { ...options, external: false });
      return { ...local, externalUnavailable: true };
    }
    throw error;
  }
}

async function requestFoodsPage(query: string, options: SearchFoodsOptions): Promise<FoodSearchPage> {
  // Qualquer consulta que pode ir às fontes externas entra no orçamento de
  // 10 por minuto (ver externalBudget.ts).
  const usesExternal = options.external !== false;
  if (usesExternal) recordExternalCall();

  const { data } = await httpClient.get<Paginated<ApiFood> | ApiFood[]>(v1('/foods'), {
    params: {
      q: query.trim(),
      page: options.page ?? 1,
      limit: options.limit ?? FOODS_PAGE_LIMIT,
      ...(options.external !== undefined ? { external: options.external } : {}),
    },
    signal: options.signal,
    ...(usesExternal ? { timeout: EXTERNAL_SEARCH_TIMEOUT_MS } : {}),
  });
  const items = unwrapItems(data).map(fromApiFood);
  return {
    items,
    meta: Array.isArray(data) ? { page: 1, limit: items.length, totalItems: items.length, totalPages: 1 } : (data.meta ?? {}),
  };
}

export async function searchFoods(
  query: string,
  options: SearchFoodsOptions = {},
): Promise<FoodItem[]> {
  return (await searchFoodsPage(query, options)).items;
}

export interface FoodSuggestions {
  items: FoodItem[];
  // Só alimentos já salvos (fontes externas indisponíveis ou orçamento de
  // consultas por minuto esgotado): a tela avisa e a busca completa segue disponível.
  localOnly: boolean;
}

// Pesquisa rápida: busca 50 itens (nas fontes externas também, enquanto o
// orçamento por minuto permitir), reordena por relevância NO APP e mostra os 8
// melhores. A relevância só atua sobre o que veio nesses 50.
export async function suggestFoods(query: string, signal?: AbortSignal): Promise<FoodSuggestions> {
  const askExternal = !USE_MOCK && canCallExternal();
  const page = await searchFoodsPage(query, {
    external: USE_MOCK ? undefined : askExternal,
    limit: FOODS_PAGE_LIMIT,
    signal,
  });
  return {
    items: rankFoodsByRelevance(page.items, query).slice(0, SUGGESTION_LIMIT),
    localOnly: !USE_MOCK && (!askExternal || page.externalUnavailable === true),
  };
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
