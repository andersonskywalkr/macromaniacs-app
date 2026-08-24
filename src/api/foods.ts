import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { mockFoods } from '@/mocks/data';
import type { FoodItem } from './types/domain';

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

// GET /api/v1/foods/search?q= — seção 51
// IMPORTANTE (seção 28/108): esta função deve ser chamada só a partir de um
// botão "Buscar" ou debounce >= ~400ms — nunca a cada tecla digitada, por
// causa do limite de 10 req/min do Open Food Facts.
export async function searchFoods(query: string): Promise<FoodItem[]> {
  if (USE_MOCK) {
    const filtered = mockFoods.filter((f) =>
      f.name.toLowerCase().includes(query.toLowerCase()),
    );
    return delay(filtered);
  }
  const { data } = await httpClient.get<FoodItem[]>('/foods/search', { params: { q: query } });
  return data;
}

// GET /api/v1/foods/barcode/:barcode — seção 51
export async function getFoodByBarcode(barcode: string): Promise<FoodItem | null> {
  if (USE_MOCK) {
    return delay(mockFoods[0] ?? null);
  }
  const { data } = await httpClient.get<FoodItem>(`/foods/barcode/${barcode}`);
  return data;
}

// POST /api/v1/foods/manual — seção 51 (UC não encontrado nas fontes externas)
export async function createManualFood(
  input: Omit<FoodItem, 'id' | 'source' | 'externalId'>,
): Promise<FoodItem> {
  if (USE_MOCK) {
    return delay({ ...input, id: `manual-${Date.now()}`, source: 'MANUAL', externalId: null });
  }
  const { data } = await httpClient.post<FoodItem>('/foods/manual', input);
  return data;
}
