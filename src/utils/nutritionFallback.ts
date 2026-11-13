import type { NutritionMetrics, UserProfile } from '@/api/types/domain';
import { calculateNutrition } from './energy';

// Fallback ÚNICO de TMB/TDEE/meta. O backend NÃO calcula nada para quem
// escolheu "Prefiro não informar": nesses casos devolve nutrition: null.
//
// - Se o backend trouxe `nutrition`, vale SEMPRE o do backend.
// - Se veio null e o perfil está completo (nascimento, sexo, altura, peso,
//   objetivo e nível de atividade), o app calcula localmente (utils/energy.ts;
//   Mifflin-St Jeor, constante -78 para "Prefiro não informar" — aproximação
//   que AGUARDA validação da Nutrição).
// - Perfil incompleto: null.
export function resolveNutrition(
  profile: UserProfile | null | undefined,
  now?: Date,
): NutritionMetrics | null {
  if (!profile) return null;
  if (profile.nutrition) return profile.nutrition;
  if (!profile.goal) return null;

  const measurement = profile.currentMeasurement;
  return calculateNutrition(
    {
      dateOfBirth: profile.dateOfBirth,
      sex: profile.biologicalSex,
      heightCm: measurement?.heightCm ?? null,
      weightKg: measurement?.weightKg ?? null,
      activityLevel: profile.activityLevel,
      goal: profile.goal,
    },
    now,
  );
}

export function resolveCalorieGoal(profile: UserProfile | null | undefined): number | null {
  return resolveNutrition(profile)?.calorieTargetKcalPerDay ?? null;
}
