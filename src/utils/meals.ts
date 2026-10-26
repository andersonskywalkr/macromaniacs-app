import type { MealLog, MealType } from '@/api/types/domain';
import { MEAL_TYPE_LABELS } from '@/api/mealName';
import type { MealDraftItem } from '@/store/mealDraftStore';
import { scaleNutrition } from './nutrition';

export type { MealType };
export type MealTypeFilter = MealType | 'ALL';

// Rótulos fixos dos tipos; como o tipo viaja para o backend está em api/mealName.ts.
export const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'BREAKFAST', label: MEAL_TYPE_LABELS.BREAKFAST },
  { value: 'LUNCH', label: MEAL_TYPE_LABELS.LUNCH },
  { value: 'DINNER', label: MEAL_TYPE_LABELS.DINNER },
  { value: 'SNACK', label: MEAL_TYPE_LABELS.SNACK },
];

export const MEAL_FILTER_OPTIONS: { value: MealTypeFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  ...MEAL_TYPE_OPTIONS,
];

export function mealTypeLabel(type: MealType): string {
  return MEAL_TYPE_LABELS[type];
}

// Título mostrado da refeição: o nome do prato, ou o rótulo do tipo quando não
// tem nome (ou "Refeição" se não houver nem tipo reconhecido).
export function mealTitle(meal: Pick<MealLog, 'name' | 'mealType'>): string {
  if (meal.name) return meal.name;
  return meal.mealType ? mealTypeLabel(meal.mealType) : 'Refeição';
}

// Padrão pelo horário: manhã -> café, meio do dia -> almoço, tarde -> lanche,
// noite -> jantar; de madrugada, lanche.
export function suggestMealType(date: Date): MealType {
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return 'BREAKFAST';
  if (hour >= 10 && hour < 15) return 'LUNCH';
  if (hour >= 15 && hour < 18) return 'SNACK';
  if (hour >= 18 && hour < 23) return 'DINNER';
  return 'SNACK';
}

export interface MealTotals {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  grams: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

// Total do rascunho (feedback visual — o backend recalcula, RNF-02).
export function draftTotals(items: MealDraftItem[]): MealTotals {
  const totals = items.reduce<MealTotals>(
    (sum, { food, amountGrams }) => {
      const scaled = scaleNutrition(food.nutritionPer100g, amountGrams);
      return {
        calories: sum.calories + scaled.calories,
        protein: sum.protein + scaled.protein,
        carbohydrates: sum.carbohydrates + scaled.carbohydrates,
        fat: sum.fat + scaled.fat,
        grams: sum.grams + amountGrams,
      };
    },
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0, grams: 0 },
  );
  return {
    calories: totals.calories,
    protein: round1(totals.protein),
    carbohydrates: round1(totals.carbohydrates),
    fat: round1(totals.fat),
    grams: round1(totals.grams),
  };
}

// Total de uma refeição já registrada.
export function mealTotals(meal: MealLog): MealTotals {
  const totals = meal.items.reduce<MealTotals>(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      protein: sum.protein + item.protein,
      carbohydrates: sum.carbohydrates + item.carbs,
      fat: sum.fat + item.fat,
      grams: sum.grams + item.amountGrams,
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0, grams: 0 },
  );
  return {
    calories: Math.round(totals.calories),
    protein: round1(totals.protein),
    carbohydrates: round1(totals.carbohydrates),
    fat: round1(totals.fat),
    grams: round1(totals.grams),
  };
}

// "Salvar refeição" só habilita com itens, quantidades válidas e sem envio em
// andamento.
export function canSaveMeal(
  items: MealDraftItem[],
  hasInvalidAmount: boolean,
  isSaving: boolean,
): boolean {
  return items.length > 0 && !hasInvalidAmount && !isSaving;
}

export function filterMealsByType(meals: MealLog[], filter: MealTypeFilter): MealLog[] {
  if (filter === 'ALL') return meals;
  return meals.filter((meal) => meal.mealType === filter);
}

// Mais recentes primeiro.
export function sortMealsNewestFirst(meals: MealLog[]): MealLog[] {
  return [...meals].sort(
    (a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime(),
  );
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function itemsCountLabel(count: number): string {
  return count === 1 ? '1 item' : `${count} itens`;
}
