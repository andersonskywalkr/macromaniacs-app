import type { UserProfile } from '@/api/types/domain';
import { resolveCalorieGoal, resolveNutrition } from './nutritionFallback';

const today = new Date(2026, 5, 15);

const base: UserProfile = {
  id: 'u',
  email: 'a@b.c',
  username: 'anderson',
  displayName: 'Anderson',
  dateOfBirth: '2001-06-15', // 25 anos em 15/06/2026
  biologicalSex: null, // conta antiga sem sexo: o backend devolve nutrition: null
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

describe('resolveNutrition (backend is the canonical source)', () => {
  it('does not invent a local recommendation when the backend returns null', () => {
    expect(resolveNutrition(base, today)).toBeNull();
    expect(resolveCalorieGoal(base)).toBeNull();
  });

  it('keeps null regardless of the goal when canonical metrics are absent', () => {
    expect(resolveNutrition({ ...base, goal: 'LOSE_WEIGHT' }, today)).toBeNull();
    expect(resolveNutrition({ ...base, goal: 'GAIN_MUSCLE' }, today)).toBeNull();
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
