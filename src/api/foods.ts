import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { mockFoods } from '@/mocks/data';
import { ApiError } from './ApiError';
import type { FoodItem } from './types/domain';

// Ignora maiúsculas e acentos na busca do mock ("feijao" acha "Feijão").
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

// GET /api/v1/foods/search?q= — seção 51
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
  const { data } = await httpClient.get<FoodItem[]>('/foods/search', { params: { q: query } });
  return data;
}

// GET /api/v1/foods/barcode/:barcode — seção 51
export async function getFoodByBarcode(barcode: string): Promise<FoodItem | null> {
  if (USE_MOCK) {
    return delay(mockFoods.find((f) => f.barcode === barcode) ?? null);
  }
  try {
    const { data } = await httpClient.get<FoodItem>(`/foods/barcode/${barcode}`);
    return data;
  } catch (error) {
    // Código sem cadastro: o contrato da função é devolver null.
    if (error instanceof ApiError && error.statusCode === 404) return null;
    throw error;
  }
}

// POST /api/v1/foods/manual — seção 51 (UC não encontrado nas fontes externas)
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
  const { data } = await httpClient.post<FoodItem>('/foods/manual', input);
  return data;
}
