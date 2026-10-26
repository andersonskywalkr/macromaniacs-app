import type { MealLog } from '@/api/types/domain';
import type { MealDraftItem } from '@/store/mealDraftStore';
import {
  canSaveMeal,
  draftTotals,
  filterMealsByType,
  mealTotals,
  mealTitle,
  sortMealsNewestFirst,
  suggestMealType,
} from './meals';

const food = (id: string, per100g: { calories: number; protein: number; carbohydrates: number; fat: number }) => ({
  id,
  name: id,
  source: 'TBCA' as const,
  externalId: null,
  barcode: null,
  nutritionPer100g: { ...per100g, fiber: 0 },
});

const rice: MealDraftItem = {
  food: food('arroz', { calories: 128, protein: 2.5, carbohydrates: 28, fat: 0.2 }),
  amountGrams: 150,
};
const chicken: MealDraftItem = {
  food: food('frango', { calories: 159, protein: 32, carbohydrates: 0, fat: 3.6 }),
  amountGrams: 120,
};

describe('draftTotals', () => {
  it('is zero for an empty draft', () => {
    expect(draftTotals([])).toEqual({ calories: 0, protein: 0, carbohydrates: 0, fat: 0, grams: 0 });
  });

  it('sums every item scaled by its amount', () => {
    // arroz 150 g: 192 kcal, P 3,8, C 42, G 0,3 | frango 120 g: 191 kcal, P 38,4, C 0, G 4,3
    expect(draftTotals([rice, chicken])).toEqual({
      calories: 383,
      protein: 42.2,
      carbohydrates: 42,
      fat: 4.6,
      grams: 270,
    });
  });
});

describe('canSaveMeal', () => {
  it('is disabled with an empty draft', () => {
    expect(canSaveMeal([], false, false)).toBe(false);
  });

  it('is enabled with items and valid amounts', () => {
    expect(canSaveMeal([rice], false, false)).toBe(true);
  });

  it('is disabled while an amount is invalid or a save is in progress', () => {
    expect(canSaveMeal([rice], true, false)).toBe(false);
    expect(canSaveMeal([rice], false, true)).toBe(false);
  });
});

describe('meal types', () => {
  it('suggests the type from the time of day', () => {
    const at = (hour: number) => suggestMealType(new Date(2026, 0, 5, hour, 0));
    expect(at(7)).toBe('BREAKFAST');
    expect(at(12)).toBe('LUNCH');
    expect(at(16)).toBe('SNACK');
    expect(at(20)).toBe('DINNER');
    expect(at(2)).toBe('SNACK');
  });

  it('shows the dish name, or the type label when there is no name', () => {
    expect(mealTitle({ name: 'Almoço de segunda', mealType: 'LUNCH' })).toBe('Almoço de segunda');
    expect(mealTitle({ name: null, mealType: 'LUNCH' })).toBe('Almoço');
    expect(mealTitle({ name: null, mealType: 'BREAKFAST' })).toBe('Café da manhã');
    expect(mealTitle({ name: null, mealType: null })).toBe('Refeição');
  });
});

const meal = (
  id: string,
  mealType: MealLog['mealType'],
  consumedAt: string,
  calories = 100,
  name: string | null = null,
): MealLog => ({
  id,
  userId: 'u',
  plannedMealId: null,
  mealType,
  name,
  photoUrl: null,
  consumedAt,
  items: [
    { id: `${id}-1`, foodId: 'f', foodName: 'F', amountGrams: 100, calories, protein: 10, carbs: 20, fat: 5, fiber: 0 },
  ],
});

describe('meal list helpers', () => {
  const meals = [
    meal('1', 'BREAKFAST', '2026-01-05T08:00:00'),
    meal('2', 'LUNCH', '2026-01-05T12:30:00'),
    meal('3', 'SNACK', '2026-01-05T16:00:00'),
    // o filtro usa o tipo, não o texto do nome
    meal('4', 'LUNCH', '2026-01-05T13:00:00', 100, 'Jantar de ontem'),
    meal('5', null, '2026-01-05T09:00:00', 100, 'Almoço antigo sem tipo'),
  ];

  it('filters by meal type, with "all" keeping everything', () => {
    expect(filterMealsByType(meals, 'ALL')).toHaveLength(5);
    expect(filterMealsByType(meals, 'LUNCH').map((m) => m.id)).toEqual(['2', '4']);
    expect(filterMealsByType(meals, 'DINNER')).toEqual([]);
    expect(filterMealsByType(meals, 'LUNCH').map((m) => m.name)).not.toContain('Almoço antigo sem tipo');
  });

  it('sorts newest first', () => {
    expect(sortMealsNewestFirst(meals).map((m) => m.id)).toEqual(['3', '4', '2', '5', '1']);
  });

  it('totals a saved meal', () => {
    expect(mealTotals(meal('1', 'LUNCH', '2026-01-05T12:00:00', 250))).toEqual({
      calories: 250,
      protein: 10,
      carbohydrates: 20,
      fat: 5,
      grams: 100,
    });
  });
});
