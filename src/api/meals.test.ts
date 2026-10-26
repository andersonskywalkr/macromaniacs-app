import { createMeal, getMealsToday } from './meals';
import { getProgressToday } from './progress';
import { resetMockMeals } from '@/mocks/mealStore';
import { mockFoods } from '@/mocks/data';

// Roda no modo mock (EXPO_PUBLIC_USE_MOCK não definido nos testes).
describe('mock daily consumption', () => {
  beforeEach(() => resetMockMeals());

  it('starts the day at zero', async () => {
    expect(await getMealsToday()).toEqual([]);
    const progress = await getProgressToday();
    expect(progress.calories.consumed).toBe(0);
    expect(progress.protein.consumed).toBe(0);
    expect(progress.carbohydrates.consumed).toBe(0);
    expect(progress.fat.consumed).toBe(0);
  });

  it('adds a saved meal to the day list and to the consumed totals', async () => {
    await createMeal({
      mealType: 'LUNCH' as const,
      name: 'Almoço de segunda',
      consumedAt: new Date().toISOString(),
      items: [
        { foodId: 'food-1', amountGrams: 150 },
        { foodId: 'food-3', amountGrams: 120 },
      ],
    });

    const meals = await getMealsToday();
    expect(meals).toHaveLength(1);
    // no mock, tipo e nome ficam separados (sem codificação)
    expect(meals[0]).toMatchObject({ mealType: 'LUNCH', name: 'Almoço de segunda' });
    expect(meals[0].items.map((i) => i.foodName)).toEqual([
      'Arroz branco cozido',
      'Peito de frango grelhado',
    ]);

    // arroz 150 g = 192 kcal + frango 120 g = 191 kcal
    const progress = await getProgressToday();
    expect(progress.calories.consumed).toBe(383);
    expect(progress.protein.consumed).toBeCloseTo(42.2, 1);
  });

  it('keeps adding up across meals', async () => {
    const input = (id: string) => ({
      mealType: 'SNACK' as const,
      consumedAt: new Date().toISOString(),
      items: [{ foodId: id, amountGrams: 100 }],
    });
    await createMeal(input('food-7'));
    await createMeal(input('food-7'));

    expect((await getProgressToday()).calories.consumed).toBe(196);
  });
});

describe('mock food test data', () => {
  it('has about 20 foods with calories close to 4P + 4C + 9G', () => {
    expect(mockFoods.length).toBeGreaterThanOrEqual(20);
    for (const food of mockFoods) {
      const { calories, protein, carbohydrates, fat } = food.nutritionPer100g;
      const estimated = 4 * protein + 4 * carbohydrates + 9 * fat;
      expect(Math.abs(estimated - calories) / calories).toBeLessThanOrEqual(0.1);
    }
  });
});
