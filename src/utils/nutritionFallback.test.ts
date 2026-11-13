import type { UserProfile } from '@/api/types/domain';
import { resolveCalorieGoal, resolveNutrition } from './nutritionFallback';

const today = new Date(2026, 5, 15);

const base: UserProfile = {
  id: 'u',
  email: 'a@b.c',
  username: 'anderson',
  displayName: 'Anderson',
  dateOfBirth: '2001-06-15', // 25 anos em 15/06/2026
  biologicalSex: 'PREFER_NOT_TO_SAY',
  goal: 'MAINTAIN',
  activityLevel: 'MODERATE',
  targetWeightKg: null,
  targetDate: null,
  dietaryRestrictions: null,
  onboardingCompleted: true,
  onboardingCompletedAt: null,
  currentMeasurement: { id: 'm', heightCm: 180, weightKg: 80, measuredAt: '2026-01-01' },
  measurements: [],
  nutrition: null,
};

describe('resolveNutrition (fallback for backends that do not calculate)', () => {
  it('calculates locally when the profile is complete and nutrition is null ("prefer not to say")', () => {
    // 25 anos, 80 kg, 180 cm, constante -78: TMB 1722; TDEE 2669,1
    expect(resolveNutrition(base, today)).toMatchObject({
      ageYears: 25,
      bmrKcalPerDay: 1722,
      tdeeKcalPerDay: 2669,
      calorieTargetKcalPerDay: 2669,
    });
  });

  it('applies the goal rule to the local target', () => {
    const lose = resolveNutrition({ ...base, goal: 'LOSE_WEIGHT' }, today);
    // déficit = 10% de 2669,1 = 266,9 (< 500)
    expect(lose?.calorieTargetKcalPerDay).toBe(2402);
    const gain = resolveNutrition({ ...base, goal: 'GAIN_MUSCLE' }, today);
    // superávit = min(266,9; 300)
    expect(gain?.calorieTargetKcalPerDay).toBe(2936);
  });

  it('always uses the backend nutrition when it exists', () => {
    const fromBackend = {
      ageYears: 30,
      bmrKcalPerDay: 1500,
      tdeeKcalPerDay: 2000,
      calorieTargetKcalPerDay: 1900,
      calculatedAt: '2026-10-01T00:00:00.000Z',
    };
    expect(resolveNutrition({ ...base, biologicalSex: 'MALE', nutrition: fromBackend }, today)).toBe(fromBackend);
    expect(resolveCalorieGoal({ ...base, nutrition: fromBackend })).toBe(1900);
  });

  it('returns null while the profile is incomplete', () => {
    expect(resolveNutrition(null)).toBeNull();
    expect(resolveNutrition({ ...base, goal: null }, today)).toBeNull();
    expect(resolveNutrition({ ...base, biologicalSex: null }, today)).toBeNull();
    expect(resolveNutrition({ ...base, dateOfBirth: null }, today)).toBeNull();
    expect(resolveNutrition({ ...base, activityLevel: null }, today)).toBeNull();
    expect(resolveNutrition({ ...base, currentMeasurement: null }, today)).toBeNull();
    expect(resolveCalorieGoal({ ...base, goal: null })).toBeNull();
  });
});
