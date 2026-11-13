import type { DailyProgressEntry } from '@/api/types/domain';
import { datesBetween } from '@/utils/performance';
import { getMockMealsToday, getMockProgressToday } from './mealStore';
import { getMockProfile } from './mockProfile';
import { mockProgressToday } from './data';

// Histórico do mock: os dias ANTERIORES a hoje são gerados de forma
// determinística (o mesmo dia sempre dá o mesmo resultado, sem aleatoriedade a
// cada abertura), coerentes com a meta do perfil mock. O dia de HOJE usa o
// consumo real da sessão (mealStore), então o que o usuário registrar aparece
// no gráfico.

function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function currentGoal(): number {
  return getMockProfile().nutrition?.calorieTargetKcalPerDay ?? mockProgressToday.calories.goal;
}

export function generateMockDay(date: string, goal: number): DailyProgressEntry {
  const seed = hash(date);
  const empty: DailyProgressEntry = {
    date,
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    mealCount: 0,
    targetCalories: goal,
  };

  // ~1 em cada 8 dias sem registro
  if (seed % 8 === 0) return empty;

  // entre 70% e 119% da meta
  const ratio = 0.7 + ((seed >>> 8) % 50) / 100;
  const calories = Math.round(goal * ratio);
  const jitter = (shift: number) => 0.9 + ((seed >>> shift) % 20) / 100;

  return {
    ...empty,
    calories,
    protein: Math.round(((calories * 0.25) / 4) * jitter(12)),
    carbohydrates: Math.round(((calories * 0.5) / 4) * jitter(16)),
    fat: Math.round(((calories * 0.25) / 9) * jitter(20)),
    fiber: 18 + (seed % 14),
    mealCount: 2 + (seed % 3),
  };
}

export function getMockProgressHistory(from: string, to: string, today: string): DailyProgressEntry[] {
  const goal = currentGoal();
  return datesBetween(from, to).flatMap((date) => {
    if (date > today) return [];
    if (date === today) {
      const progress = getMockProgressToday();
      return [
        {
          date,
          calories: progress.calories.consumed,
          protein: progress.protein.consumed,
          carbohydrates: progress.carbohydrates.consumed,
          fat: progress.fat.consumed,
          fiber: 0,
          mealCount: getMockMealsToday().length,
          targetCalories: progress.calories.goal,
        },
      ];
    }
    return [generateMockDay(date, goal)];
  });
}
