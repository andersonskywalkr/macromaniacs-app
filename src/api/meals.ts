import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { mockFoods, mockMealLogs } from '@/mocks/data';
import { addMockMeal, getMockMealsToday } from '@/mocks/mealStore';
import { scaleNutrition } from '@/utils/nutrition';
import { decodeMealName, encodeMealName } from './mealName';
import type { MealLog, MealLogItem, MealType } from './types/domain';

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

// Formato do backend real: só `name` (o tipo vai codificado dentro dele — ver
// api/mealName.ts).
type ApiMealLog = Omit<MealLog, 'mealType' | 'name'> & { name: string };

function fromApiMeal(raw: ApiMealLog): MealLog {
  const { mealType, name } = decodeMealName(raw.name);
  return { ...raw, mealType, name };
}

export interface CreateMealInput {
  // Tipo (obrigatório) e nome do prato (opcional) ficam separados no app.
  mealType: MealType;
  name?: string;
  plannedMealId?: string;
  photoUrl?: string;
  consumedAt: string;
  items: Array<Pick<MealLogItem, 'foodId' | 'amountGrams'>>;
}

// POST /api/v1/meals — seção 54, fluxo UC-08 (seção 127.2)
export async function createMeal(input: CreateMealInput): Promise<MealLog> {
  if (USE_MOCK) {
    const meal: MealLog = {
      id: `meal-${Date.now()}`,
      userId: 'user-1',
      plannedMealId: input.plannedMealId ?? null,
      mealType: input.mealType,
      name: input.name?.trim() || null,
      photoUrl: input.photoUrl ?? null,
      consumedAt: input.consumedAt,
      // O backend recalcularia os totais (RNF-02); no mock calculamos a partir
      // do alimento, se conhecido.
      items: input.items.map((item, index) => buildMockItem(item, index)),
    };
    // Guarda na sessão pra aparecer em getMealsToday e somar no progresso.
    addMockMeal(meal);
    return delay(meal);
  }
  const { mealType, name, ...rest } = input;
  const { data } = await httpClient.post<ApiMealLog>('/meals', {
    ...rest,
    name: encodeMealName(mealType, name),
  });
  return fromApiMeal(data);
}

// GET /api/v1/meals/today — seção 54
export async function getMealsToday(): Promise<MealLog[]> {
  if (USE_MOCK) {
    return delay(getMockMealsToday());
  }
  const { data } = await httpClient.get<ApiMealLog[]>('/meals/today');
  return data.map(fromApiMeal);
}

// GET /api/v1/meals?from=&to= — usado pelo cálculo local de streak (seção 127.4)
// Pendência 11 do documento: confirmar com o backend os nomes exatos de
// `from`/`to`. Por enquanto assume esses nomes de query param.
export async function getMealsByDateRange(from: string, to: string): Promise<MealLog[]> {
  if (USE_MOCK) {
    return delay(mockMealLogs);
  }
  const { data } = await httpClient.get<ApiMealLog[]>('/meals', { params: { from, to } });
  return data.map(fromApiMeal);
}
