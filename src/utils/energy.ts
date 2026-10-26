import type {
  ActivityLevel,
  BiologicalSex,
  NutritionGoal,
  NutritionMetrics,
} from '@/api/types/domain';

// Cálculo de TMB/TDEE usado SÓ pelo modo mock. Em modo real o app usa o que o
// backend devolve (nutrition.bmrKcalPerDay / tdeeKcalPerDay).

// Mifflin-St Jeor: TMB = 10 x peso(kg) + 6,25 x altura(cm) - 5 x idade + constante.
// ATENÇÃO: a constante -78 de "Prefiro não informar" é só uma aproximação de
// engenharia (média de +5 e -161). Precisa ser validada pelos alunos de
// Nutrição antes de valer para o produto final.
export const BMR_SEX_CONSTANT: Record<BiologicalSex, number> = {
  MALE: 5,
  FEMALE: -161,
  PREFER_NOT_TO_SAY: -78,
};

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  INTENSE: 1.725,
  VERY_INTENSE: 1.9,
};

// Regra de objetivo do mock: só emagrecimento tem ajuste (-10%, a mesma razão
// 2511/2790 que o mock já usava). Os demais objetivos usam o TDEE como meta
// até o grupo de Nutrição definir a regra.
export const GOAL_CALORIE_FACTOR: Record<NutritionGoal, number> = {
  LOSE_WEIGHT: 0.9,
  GAIN_MUSCLE: 1,
  GAIN_STRENGTH: 1,
  MAINTAIN: 1,
  PERFORMANCE: 1,
};

export function calculateBmr(input: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: BiologicalSex;
}): number {
  return (
    10 * input.weightKg +
    6.25 * input.heightCm -
    5 * input.ageYears +
    BMR_SEX_CONSTANT[input.sex]
  );
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_FACTOR[activityLevel];
}

export function calculateCalorieTarget(tdee: number, goal: NutritionGoal | null): number {
  return tdee * (goal ? GOAL_CALORIE_FACTOR[goal] : 1);
}

export function ageFromDateOfBirth(dateOfBirth: string, today: Date = new Date()): number {
  const [year, month, day] = dateOfBirth.slice(0, 10).split('-').map(Number);
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age -= 1;
  }
  return age;
}

export interface EnergyInputs {
  dateOfBirth: string | null;
  sex: BiologicalSex | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  goal: NutritionGoal | null;
}

// null enquanto faltar algum dado do perfil. Valores arredondados, como o
// backend devolve.
export function calculateNutrition(
  input: EnergyInputs,
  today: Date = new Date(),
): NutritionMetrics | null {
  const { dateOfBirth, sex, heightCm, weightKg, activityLevel, goal } = input;
  if (!dateOfBirth || !sex || !heightCm || !weightKg || !activityLevel) return null;

  const ageYears = ageFromDateOfBirth(dateOfBirth, today);
  const bmr = calculateBmr({ weightKg, heightCm, ageYears, sex });
  const tdee = calculateTdee(bmr, activityLevel);

  return {
    ageYears,
    bmrKcalPerDay: Math.round(bmr),
    tdeeKcalPerDay: Math.round(tdee),
    calorieTargetKcalPerDay: Math.round(calculateCalorieTarget(tdee, goal)),
    calculatedAt: today.toISOString(),
  };
}
