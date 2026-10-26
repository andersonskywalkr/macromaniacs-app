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
  it('gives 1805 for male, 1639 for female and 1722 for "prefer not to say"', () => {
    expect(calculateBmr({ ...base, sex: 'MALE' })).toBe(1805);
    expect(calculateBmr({ ...base, sex: 'FEMALE' })).toBe(1639);
    expect(calculateBmr({ ...base, sex: 'PREFER_NOT_TO_SAY' })).toBe(1722);
  });

  it('uses the mean of the male and female constants for "prefer not to say"', () => {
    const male = calculateBmr({ ...base, sex: 'MALE' });
    const female = calculateBmr({ ...base, sex: 'FEMALE' });
    expect(calculateBmr({ ...base, sex: 'PREFER_NOT_TO_SAY' })).toBeCloseTo((male + female) / 2, 5);
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

  it('starts from the TDEE; only weight loss has an adjustment in the mock', () => {
    expect(calculateCalorieTarget(2000, 'MAINTAIN')).toBe(2000);
    expect(calculateCalorieTarget(2000, null)).toBe(2000);
    expect(calculateCalorieTarget(2000, 'LOSE_WEIGHT')).toBe(1800);
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

  it('computes the three values for each sex option', () => {
    expect(calculateNutrition({ ...profile, sex: 'MALE' }, today)).toMatchObject({
      ageYears: 25,
      bmrKcalPerDay: 1805,
      tdeeKcalPerDay: 2798,
      calorieTargetKcalPerDay: 2798,
    });
    expect(calculateNutrition({ ...profile, sex: 'FEMALE' }, today)?.bmrKcalPerDay).toBe(1639);
    expect(calculateNutrition({ ...profile, sex: 'PREFER_NOT_TO_SAY' }, today)?.bmrKcalPerDay).toBe(1722);
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
