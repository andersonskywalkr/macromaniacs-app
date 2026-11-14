import {
  ageFromDateOfBirth,
  calculateBmr,
  calculateCalorieTarget,
  calculateNutrition,
  calculateTdee,
} from './energy';

// Referência: 25 anos, 80 kg, 180 cm.
const base = { weightKg: 80, heightCm: 180, ageYears: 25 };

describe('BMR (Mifflin-St Jeor)', () => {
  it('gives 1805 for male and 1639 for female', () => {
    expect(calculateBmr({ ...base, sex: 'MALE' })).toBe(1805);
    expect(calculateBmr({ ...base, sex: 'FEMALE' })).toBe(1639);
  });
});

describe('TDEE and calorie target', () => {
  it('multiplies the BMR by the activity factor (male, moderate = 2797,75)', () => {
    expect(calculateTdee(1805, 'MODERATE')).toBeCloseTo(2797.75, 5);
    expect(calculateTdee(1000, 'SEDENTARY')).toBe(1200);
    expect(calculateTdee(1000, 'LIGHT')).toBe(1375);
    expect(calculateTdee(1000, 'INTENSE')).toBe(1725);
    expect(calculateTdee(1000, 'VERY_INTENSE')).toBe(1900);
  });

  it('follows the backend rule: -10% (max 500) to lose, +10% (max 300) to gain, TDEE otherwise', () => {
    expect(calculateCalorieTarget(2000, 'MAINTAIN')).toBe(2000);
    expect(calculateCalorieTarget(2000, null)).toBe(2000);
    expect(calculateCalorieTarget(2000, 'RECOMPOSITION')).toBe(2000);
    expect(calculateCalorieTarget(2000, 'PERFORMANCE')).toBe(2000);
    expect(calculateCalorieTarget(2000, 'GAIN_STRENGTH')).toBe(2000);
    expect(calculateCalorieTarget(2000, 'LOSE_WEIGHT')).toBe(1800);
    expect(calculateCalorieTarget(2000, 'GAIN_MUSCLE')).toBe(2200);
  });

  it('caps the deficit at 500 kcal and the surplus at 300 kcal', () => {
    expect(calculateCalorieTarget(6000, 'LOSE_WEIGHT')).toBe(5500);
    expect(calculateCalorieTarget(6000, 'GAIN_MUSCLE')).toBe(6300);
  });

  it('never goes below the BMR or above TDEE + 300', () => {
    expect(calculateCalorieTarget(2000, 'LOSE_WEIGHT', 1900)).toBe(1900);
    expect(calculateCalorieTarget(2000, 'LOSE_WEIGHT', 1500)).toBe(1800);
    expect(calculateCalorieTarget(2000, 'MAINTAIN', 2600)).toBe(2300);
  });
});

describe('calculateNutrition', () => {
  const today = new Date(2026, 5, 15);
  const profile = {
    dateOfBirth: '2001-06-15', // 25 anos em 15/06/2026
    heightCm: 180,
    weightKg: 80,
    activityLevel: 'MODERATE' as const,
    goal: 'MAINTAIN' as const,
  };

  it('computes the three values for each sex option (only MALE and FEMALE exist)', () => {
    expect(calculateNutrition({ ...profile, sex: 'MALE' }, today)).toMatchObject({
      ageYears: 25,
      bmrKcalPerDay: 1805,
      tdeeKcalPerDay: 2798,
      calorieTargetKcalPerDay: 2798,
    });
    expect(calculateNutrition({ ...profile, sex: 'FEMALE' }, today)?.bmrKcalPerDay).toBe(1639);
  });

  it('returns null while the profile is incomplete', () => {
    expect(calculateNutrition({ ...profile, sex: null }, today)).toBeNull();
    expect(calculateNutrition({ ...profile, sex: 'MALE', weightKg: null }, today)).toBeNull();
  });

  it('computes the age considering the birthday', () => {
    expect(ageFromDateOfBirth('2001-06-16', today)).toBe(24);
    expect(ageFromDateOfBirth('2001-06-15', today)).toBe(25);
  });
});
