import { defaultMacroGoals } from '@/utils/dailyProgress';
import type { GamificationStats, ProgressToday } from '../types/domain';
import { toNumber } from './common';

// GET /v1/progress/daily: valores soltos, sem meta por macro.
export interface ApiDailyProgress {
  date?: string;
  timezone?: string;
  calories: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
  fiber?: number | string;
  mealCount?: number;
  targetCalories?: number | string | null;
  calorieProgressPercent?: number | string | null;
  updatedAt?: string;
}

// GET /v1/gamification/summary
export interface ApiGamificationSummary {
  currentStreak: number | string;
  bestStreak: number | string;
  totalPoints: number | string;
  lastActivityDate?: string | null;
  timezone?: string;
  scoringVersion?: string | number;
}

// Metas de macros que o backend não fornece: divisão padrão (50/25/25) sobre a
// meta de calorias. Sem meta de calorias, ficam 0 (a tela cai no fallback dela).
function goalsFor(calorieGoal: number) {
  return calorieGoal > 0
    ? defaultMacroGoals(calorieGoal)
    : { protein: 0, carbohydrates: 0, fat: 0 };
}

// `fallbackCalorieGoal` = meta calculada pelo app (utils/nutritionFallback)
// para quando o backend devolve targetCalories nulo.
export function fromApiDailyProgress(
  raw: ApiDailyProgress | null | undefined,
  fallbackCalorieGoal: number | null = null,
): ProgressToday {
  const target = raw?.targetCalories;
  const calorieGoal =
    target !== null && target !== undefined ? toNumber(target) : (fallbackCalorieGoal ?? 0);
  const macroGoals = goalsFor(calorieGoal);

  return {
    calories: { goal: calorieGoal, consumed: toNumber(raw?.calories) },
    protein: { goal: macroGoals.protein, consumed: toNumber(raw?.protein) },
    carbohydrates: { goal: macroGoals.carbohydrates, consumed: toNumber(raw?.carbs) },
    fat: { goal: macroGoals.fat, consumed: toNumber(raw?.fat) },
  };
}

// Dia sem refeições (404 ou vazio): consumo zero.
export function emptyDailyProgress(fallbackCalorieGoal: number | null = null): ProgressToday {
  return fromApiDailyProgress(null, fallbackCalorieGoal);
}

export function fromApiGamificationSummary(raw: ApiGamificationSummary): GamificationStats {
  return {
    points: toNumber(raw.totalPoints),
    currentStreak: toNumber(raw.currentStreak),
    bestStreak: toNumber(raw.bestStreak),
  };
}
