import { decodeMealName, encodeMealName } from '../mealName';
import type { MealLog, MealLogItem, MealType } from '../types/domain';
import { round2, toNumber } from './common';

// Refeição como o backend devolve. Não tem userId; foodId e foodName podem vir
// nulos (alimento removido).
export interface ApiMealItem {
  id: string;
  foodId?: string | null;
  foodName?: string | null;
  amountGrams: number | string;
  calories: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
  fiber: number | string;
  inputMethod?: string;
}

export interface ApiMeal {
  id: string;
  plannedMealId?: string | null;
  name: string;
  photoUrl?: string | null;
  consumedAt: string;
  foodDate?: string;
  timezone?: string;
  items: ApiMealItem[];
  totals?: Record<string, number | string>;
  createdAt?: string;
  updatedAt?: string;
}

// Corpo de POST /v1/meals/manual: SÓ estes campos (nada de plannedMealId).
export interface ApiCreateMealBody {
  name: string;
  consumedAt?: string;
  photoUrl?: string;
  items: { foodId: string; amountGrams: number }[];
}

export interface CreateMealParams {
  // Tipo (obrigatório) e nome do prato (opcional) ficam separados no app.
  mealType: MealType;
  name?: string;
  photoUrl?: string;
  consumedAt: string;
  items: { foodId: string; amountGrams: number }[];
}

const NAME_MAX = 100;
export const MEAL_ITEMS_MAX = 50;
export const MEAL_ITEM_FALLBACK_NAME = 'Alimento';

export function toApiCreateMeal(input: CreateMealParams): ApiCreateMealBody {
  const body: ApiCreateMealBody = {
    name: encodeMealName(input.mealType, input.name).slice(0, NAME_MAX),
    consumedAt: input.consumedAt,
    items: input.items.map((item) => ({
      foodId: item.foodId,
      amountGrams: round2(item.amountGrams, 0.01),
    })),
  };
  if (input.photoUrl) body.photoUrl = input.photoUrl;
  return body;
}

function fromApiItem(item: ApiMealItem): MealLogItem {
  return {
    id: item.id,
    foodId: item.foodId ?? '',
    foodName: item.foodName ?? MEAL_ITEM_FALLBACK_NAME,
    amountGrams: toNumber(item.amountGrams),
    calories: toNumber(item.calories),
    protein: toNumber(item.protein),
    carbs: toNumber(item.carbs),
    fat: toNumber(item.fat),
    fiber: toNumber(item.fiber),
  };
}

export function fromApiMeal(meal: ApiMeal): MealLog {
  const { mealType, name } = decodeMealName(meal.name);
  return {
    id: meal.id,
    plannedMealId: meal.plannedMealId ?? null,
    mealType,
    name,
    photoUrl: meal.photoUrl ?? null,
    consumedAt: meal.consumedAt,
    items: (meal.items ?? []).map(fromApiItem),
  };
}
