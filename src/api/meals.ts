import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { mockMealLogs } from '@/mocks/data';
import type { MealLog, MealLogItem } from './types/domain';

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

export interface CreateMealInput {
  name: string;
  plannedMealId?: string;
  photoUrl?: string;
  consumedAt: string;
  items: Array<Pick<MealLogItem, 'foodId' | 'amountGrams'>>;
}

// POST /api/v1/meals — seção 54, fluxo UC-08 (seção 127.2)
export async function createMeal(input: CreateMealInput): Promise<MealLog> {
  if (USE_MOCK) {
    return delay({
      id: `meal-${Date.now()}`,
      userId: 'user-1',
      plannedMealId: input.plannedMealId ?? null,
      name: input.name,
      photoUrl: input.photoUrl ?? null,
      consumedAt: input.consumedAt,
      items: [], // backend recalcularia os totais nutricionais (RNF-02)
    });
  }
  const { data } = await httpClient.post<MealLog>('/meals', input);
  return data;
}

// GET /api/v1/meals/today — seção 54
export async function getMealsToday(): Promise<MealLog[]> {
  if (USE_MOCK) {
    return delay(mockMealLogs);
  }
  const { data } = await httpClient.get<MealLog[]>('/meals/today');
  return data;
}

// GET /api/v1/meals?from=&to= — usado pelo cálculo local de streak (seção 127.4)
// Pendência 11 do documento: confirmar com o backend os nomes exatos de
// `from`/`to`. Por enquanto assume esses nomes de query param.
export async function getMealsByDateRange(from: string, to: string): Promise<MealLog[]> {
  if (USE_MOCK) {
    return delay(mockMealLogs);
  }
  const { data } = await httpClient.get<MealLog[]>('/meals', { params: { from, to } });
  return data;
}
