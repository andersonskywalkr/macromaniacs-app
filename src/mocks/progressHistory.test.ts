import { createMeal } from '@/api/meals';
import { getProgressHistory } from '@/api/progress';
import { resetMockMeals } from './mealStore';
import { resetMockProfile } from './mockProfile';
import { generateMockDay } from './progressHistory';
import { addDays, datesBetween } from '@/utils/performance';
import { todayInTimezone } from '@/utils/today';

// Modo mock: histórico determinístico, com o dia de hoje vindo do consumo real.
describe('mock progress history', () => {
  const timezone = 'America/Sao_Paulo';
  const today = todayInTimezone(timezone);

  beforeEach(() => {
    resetMockMeals();
    resetMockProfile();
  });

  it('is the same every time (no randomness per opening)', async () => {
    const from = addDays(today, -29);
    const first = await getProgressHistory(from, today, timezone);
    const second = await getProgressHistory(from, today, timezone);

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(20);
    expect(first.length).toBeLessThanOrEqual(30);
    expect(generateMockDay('2026-09-10', 2000)).toEqual(generateMockDay('2026-09-10', 2000));
  });

  it('is coherent with the profile goal, with some empty days and some days close to the goal', async () => {
    const entries = await getProgressHistory(addDays(today, -29), addDays(today, -1), timezone);
    const goal = entries[0].targetCalories as number;

    expect(goal).toBeGreaterThan(1000);
    expect(entries.every((e) => e.targetCalories === goal)).toBe(true);
    expect(entries.every((e) => e.calories <= goal * 1.2)).toBe(true);

    // com datas fixas (o resultado não depende do dia em que o teste roda)
    const sample = datesBetween('2026-01-01', '2026-03-01').map((date) => generateMockDay(date, 2000));
    expect(sample.some((day) => day.calories === 0)).toBe(true);
    expect(sample.filter((day) => day.calories > 0).length).toBeGreaterThan(40);
    expect(sample.some((day) => day.calories >= 1800 && day.calories <= 2200)).toBe(true);
  });

  it('shows today as zero at the start and updates with what the user registers', async () => {
    const readToday = async () =>
      (await getProgressHistory(today, today, timezone)).find((e) => e.date === today);

    expect(await readToday()).toMatchObject({ calories: 0, mealCount: 0 });

    await createMeal({
      mealType: 'LUNCH',
      consumedAt: new Date().toISOString(),
      items: [{ foodId: 'food-1', amountGrams: 150 }],
    });

    expect(await readToday()).toMatchObject({ calories: 192, mealCount: 1 });
  });

  it('never invents days in the future', async () => {
    const entries = await getProgressHistory(today, addDays(today, 5), timezone);
    expect(entries.map((e) => e.date)).toEqual([today]);
  });
});
