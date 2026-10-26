import { createManualFood, getFoodByBarcode, searchFoods } from './foods';
import { createMeal } from './meals';

// Roda no modo mock (EXPO_PUBLIC_USE_MOCK não definido nos testes).
describe('mock foods and meals API', () => {
  it('has similar names to exercise the confirmation step', async () => {
    const results = await searchFoods('frango');
    const names = results.map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['Frango grelhado', 'Frango frito']));
  });

  it('ignores accents and case when searching', async () => {
    const results = await searchFoods('FEIJAO');
    expect(results.map((f) => f.name)).toContain('Feijão carioca cozido');
  });

  it('finds a food by barcode and returns null for an unknown one', async () => {
    expect((await getFoodByBarcode('7891234567895'))?.name).toBe('Iogurte natural integral');
    expect(await getFoodByBarcode('0000000000000')).toBeNull();
  });

  it('makes a manually created food searchable', async () => {
    const created = await createManualFood({
      name: 'Pão de queijo caseiro',
      brand: null,
      barcode: null,
      nutritionPer100g: { calories: 300, protein: 6, carbohydrates: 40, fat: 12, fiber: 0 },
    });

    expect(created.source).toBe('MANUAL');
    expect((await searchFoods('pao de queijo')).map((f) => f.id)).toContain(created.id);
  });

  it('createMeal returns the items that were sent, with computed values', async () => {
    const meal = await createMeal({
      mealType: 'LUNCH' as const,
      consumedAt: new Date().toISOString(),
      items: [{ foodId: 'food-1', amountGrams: 200 }],
    });

    expect(meal.items).toHaveLength(1);
    expect(meal.items[0]).toMatchObject({
      foodId: 'food-1',
      foodName: 'Arroz branco cozido',
      amountGrams: 200,
      calories: 256,
    });
  });
});
