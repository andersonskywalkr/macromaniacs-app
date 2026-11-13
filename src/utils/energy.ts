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

// Regra de meta alinhada à do backend: emagrecimento = TDEE -10% (déficit
// máximo de 500 kcal/dia); ganho de massa = TDEE +10% (superávit máximo de
// 300 kcal/dia); demais objetivos = TDEE. A meta nunca fica abaixo do TMB nem
// acima de TDEE + 300. LIMITAÇÃO: o backend ainda ajusta pelo prazo e pelo
// peso-alvo; este cálculo local (mock e fallback) não reproduz isso.
export const LOSE_WEIGHT_RATE = 0.1;
export const LOSE_WEIGHT_MAX_DEFICIT_KCAL = 500;
export const GAIN_MUSCLE_RATE = 0.1;
export const GAIN_MUSCLE_MAX_SURPLUS_KCAL = 300;
export const MAX_SURPLUS_OVER_TDEE_KCAL = 300;

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

export function calculateCalorieTarget(
  tdee: number,
  goal: NutritionGoal | null,
  bmr?: number,
): number {
  let target = tdee;
  if (goal === 'LOSE_WEIGHT') {
    target = tdee - Math.min(tdee * LOSE_WEIGHT_RATE, LOSE_WEIGHT_MAX_DEFICIT_KCAL);
  } else if (goal === 'GAIN_MUSCLE') {
    target = tdee + Math.min(tdee * GAIN_MUSCLE_RATE, GAIN_MUSCLE_MAX_SURPLUS_KCAL);
  }
  if (bmr !== undefined) target = Math.max(target, bmr);
  return Math.min(target, tdee + MAX_SURPLUS_OVER_TDEE_KCAL);
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
    calorieTargetKcalPerDay: Math.round(calculateCalorieTarget(tdee, goal, bmr)),
    calculatedAt: today.toISOString(),
  };
}
