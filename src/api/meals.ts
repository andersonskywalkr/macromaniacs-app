import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { v1 } from './paths';
import { mockFoods, mockMealLogs } from '@/mocks/data';
import { addMockMeal, getMockMealsToday } from '@/mocks/mealStore';
import { scaleNutrition } from '@/utils/nutrition';
import { resolveTimezone, todayInTimezone } from '@/utils/today';
import { unwrapItems, type Paginated } from './adapters/common';
import { fromApiMeal, toApiCreateMeal, type ApiMeal } from './adapters/meals';
import type { MealLog, MealLogItem, MealType } from './types/domain';

// Sem paginação (a forma do `meta` não foi confirmada): pede uma página grande
// e lê só `items`. Um dia tem poucas refeições; o intervalo de datas pode ter mais.
const MEALS_PAGE_LIMIT = 50;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

function buildMockItem(
  item: CreateMealInput['items'][number],
  index: number,
): MealLogItem {
  const food = mockFoods.find((f) => f.id === item.foodId);
  const scaled = food
    ? scaleNutrition(food.nutritionPer100g, item.amountGrams)
    : { calories: 0, protein: 0, carbohydrates: 0, fat: 0 };

  return {
    id: `item-${Date.now()}-${index}`,
    foodId: item.foodId,
    foodName: food?.name ?? 'Alimento',
    amountGrams: item.amountGrams,
    calories: scaled.calories,
    protein: scaled.protein,
    carbs: scaled.carbohydrates,
    fat: scaled.fat,
    fiber: food ? (food.nutritionPer100g.fiber * item.amountGrams) / 100 : 0,
  };
}

export interface CreateMealInput {
  // Tipo (obrigatório) e nome do prato (opcional) ficam separados no app.
  mealType: MealType;
  name?: string;
  photoUrl?: string;
  consumedAt: string;
  items: Array<Pick<MealLogItem, 'foodId' | 'amountGrams'>>;
}

// POST /v1/meals/manual. O backend só tem `name`: tipo e nome viajam juntos
// ("Tipo - Nome", ver api/mealName.ts). Não envia plannedMealId nem extras.
export async function createMeal(input: CreateMealInput): Promise<MealLog> {
  if (USE_MOCK) {
    const meal: MealLog = {
      id: `meal-${Date.now()}`,
      userId: 'user-1',
      plannedMealId: null,
      mealType: input.mealType,
      name: input.name?.trim() || null,
      photoUrl: input.photoUrl ?? null,
      consumedAt: input.consumedAt,
      // O backend recalcula os totais (RNF-02); no mock calculamos a partir
      // do alimento, se conhecido.
      items: input.items.map((item, index) => buildMockItem(item, index)),
    };
    // Guarda na sessão pra aparecer em getMealsToday e somar no progresso.
    addMockMeal(meal);
    return delay(meal);
  }
  const { data } = await httpClient.post<ApiMeal>(v1('/meals/manual'), toApiCreateMeal(input));
  return fromApiMeal(data);
}

async function fetchMealsBetween(from: string, to: string): Promise<MealLog[]> {
  const { data } = await httpClient.get<Paginated<ApiMeal> | ApiMeal[]>(v1('/meals'), {
    params: { from, to, limit: MEALS_PAGE_LIMIT },
  });
  return unwrapItems(data).map(fromApiMeal);
}

// GET /v1/meals?from=HOJE&to=HOJE (não existe /meals/today). HOJE é a data no
// fuso do usuário (perfil, ou o do aparelho).
export async function getMealsToday(timezone?: string | null): Promise<MealLog[]> {
  if (USE_MOCK) {
    return delay(getMockMealsToday());
  }
  const today = todayInTimezone(resolveTimezone(timezone));
  return fetchMealsBetween(today, today);
}

// GET /v1/meals?from=&to= (AAAA-MM-DD) — usado pelo cálculo local de streak
// (seção 127.4).
export async function getMealsByDateRange(from: string, to: string): Promise<MealLog[]> {
  if (USE_MOCK) {
    return delay(mockMealLogs);
  }
  return fetchMealsBetween(from, to);
}
