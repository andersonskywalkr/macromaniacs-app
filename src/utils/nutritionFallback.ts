import type { NutritionMetrics, UserProfile } from '@/api/types/domain';

// O backend é a única fonte de métricas nutricionais canônicas. Para perfis
// sem cálculo disponível (por exemplo, sexo não informado), a UI mostra a
// ausência explicitamente em vez de apresentar uma estimativa não validada.
export function resolveNutrition(
  profile: UserProfile | null | undefined,
  _now?: Date,
): NutritionMetrics | null {
  void _now;
  return profile?.nutrition ?? null;
}

export function resolveCalorieGoal(profile: UserProfile | null | undefined): number | null {
  return resolveNutrition(profile)?.calorieTargetKcalPerDay ?? null;
}
