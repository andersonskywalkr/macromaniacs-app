import type { MealLog, ProgressToday } from '@/api/types/domain';
import { defaultMacroGoals } from '@/utils/dailyProgress';
import { getMockProfile } from './mockProfile';
import { mockProgressToday } from './data';

// Refeições salvas durante a sessão do app, só no modo mock — simula o que o
// backend real guarda. Em memória: some ao reiniciar o app. Começa vazio, então
// o consumo do dia começa em 0.
let meals: MealLog[] = [];

export function addMockMeal(meal: MealLog): void {
  meals = [...meals, meal];
}

export function getMockMealsToday(): MealLog[] {
  return [...meals];
}

export function resetMockMeals(): void {
  meals = [];
}

// Soma o que foi consumido nas refeições salvas. A meta de calorias é a do
// perfil mock (muda quando o perfil é editado) e as metas de macros seguem a
// divisão padrão dessa meta.
export function getMockProgressToday(): ProgressToday {
  const items = meals.flatMap((meal) => meal.items);
  const sum = (pick: (item: (typeof items)[number]) => number) =>
    items.reduce((total, item) => total + pick(item), 0);
  const round = (value: number) => Math.round(value * 10) / 10;

  const calorieGoal =
    getMockProfile().nutrition?.calorieTargetKcalPerDay ?? mockProgressToday.calories.goal;
  const macroGoals = defaultMacroGoals(calorieGoal);

  return {
    calories: { goal: calorieGoal, consumed: Math.round(sum((i) => i.calories)) },
    protein: { goal: macroGoals.protein, consumed: round(sum((i) => i.protein)) },
    carbohydrates: { goal: macroGoals.carbohydrates, consumed: round(sum((i) => i.carbs)) },
    fat: { goal: macroGoals.fat, consumed: round(sum((i) => i.fat)) },
  };
}
