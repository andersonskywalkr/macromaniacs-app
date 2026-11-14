import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { v1 } from './paths';
import { mockFoods, mockMealLogs } from '@/mocks/data';
import { addMockMeal, deleteMockMeal, getMockMealsToday, replaceMockMeal } from '@/mocks/mealStore';
import { scaleNutrition } from '@/utils/nutrition';
import { resolveTimezone, todayInTimezone } from '@/utils/today';
import { unwrapItems, type Paginated } from './adapters/common';
import {
  fromApiMeal,
  toApiCreateMeal,
  type ApiMeal,
  type ApiUpdateMealBody,
} from './adapters/meals';
import type { MealLog, MealLogItem, MealType } from './types/domain';

// Página moderada; intervalos maiores percorrem todas as páginas informadas em
// `meta.totalPages` para não truncar o histórico.
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
  // Identifica a operação lógica. É gerada antes da primeira tentativa e
  // preservada na fila offline para todos os reenvios.
  idempotencyKey?: string;
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
  if (!input.idempotencyKey) {
    throw new Error('A chave de idempotência da refeição é obrigatória.');
  }
  const { data } = await httpClient.post<ApiMeal>(
    v1('/meals/manual'),
    toApiCreateMeal(input),
    { headers: { 'Idempotency-Key': input.idempotencyKey } },
  );
  return fromApiMeal(data);
}

async function fetchMealsBetween(from: string, to: string): Promise<MealLog[]> {
  const meals: MealLog[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const { data } = await httpClient.get<Paginated<ApiMeal> | ApiMeal[]>(v1('/meals'), {
      params: { from, to, page, limit: MEALS_PAGE_LIMIT },
    });
    meals.push(...unwrapItems(data).map(fromApiMeal));
    totalPages = Array.isArray(data) ? 1 : (data.meta?.totalPages ?? 1);
    page += 1;
  } while (page <= totalPages);
  return meals;
}

export async function updateMealItems(
  mealId: string,
  items: NonNullable<ApiUpdateMealBody['items']>,
): Promise<MealLog> {
  if (USE_MOCK) {
    const current = getMockMealsToday().find((meal) => meal.id === mealId);
    if (!current) throw new Error('Refeição não encontrada.');
    const updated = {
      ...current,
      items: items.map((item, index) => buildMockItem(item, index)),
    };
    replaceMockMeal(updated);
    return delay(updated);
  }
  const { data } = await httpClient.patch<ApiMeal>(v1(`/meals/${mealId}`), { items });
  return fromApiMeal(data);
}

export async function deleteMeal(mealId: string): Promise<void> {
  if (USE_MOCK) {
    deleteMockMeal(mealId);
    await delay(undefined);
    return;
  }
  await httpClient.delete(v1(`/meals/${mealId}`));
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
