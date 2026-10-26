import { getMyProfile, updateMyProfile } from '@/api/users';
import { createMeal } from '@/api/meals';
import { getProgressToday } from '@/api/progress';
import { resetMockMeals } from './mealStore';
import { resetMockProfile } from './mockProfile';

// Modo mock (EXPO_PUBLIC_USE_MOCK / EXPO_PUBLIC_USE_AUTH_MOCK não definidos).
describe('mock profile and calorie target', () => {
  beforeEach(() => {
    resetMockProfile();
    resetMockMeals();
  });

  it('calculates the nutrition from the profile instead of fixed numbers', async () => {
    const profile = await getMyProfile();
    expect(profile.nutrition?.bmrKcalPerDay).toBeGreaterThan(0);
    // TDEE = TMB x 1,55 (atividade moderada) e meta = TDEE -10% (emagrecimento)
    expect(Math.abs(profile.nutrition!.tdeeKcalPerDay - profile.nutrition!.bmrKcalPerDay * 1.55)).toBeLessThan(1);
  });

  it('changes the calorie target after editing weight, activity and sex', async () => {
    const before = (await getMyProfile()).nutrition!;

    const updated = await updateMyProfile({
      biologicalSex: 'PREFER_NOT_TO_SAY',
      currentWeightKg: 70,
      heightCm: 178,
      activityLevel: 'LIGHT',
    });

    expect(updated.biologicalSex).toBe('PREFER_NOT_TO_SAY');
    expect(updated.currentMeasurement).toMatchObject({ weightKg: 70, heightCm: 178 });
    expect(updated.nutrition!.calorieTargetKcalPerDay).not.toBe(before.calorieTargetKcalPerDay);
    // 10 x 70 + 6,25 x 178 - 5 x idade - 78
    const age = updated.nutrition!.ageYears;
    expect(updated.nutrition!.bmrKcalPerDay).toBe(Math.round(700 + 1112.5 - 5 * age - 78));

    // a próxima leitura devolve o perfil editado
    expect((await getMyProfile()).nutrition).toEqual(updated.nutrition);
  });

  it('uses a different BMR for each of the three sex options', async () => {
    const bmr = async (sex: string) =>
      (await updateMyProfile({ biologicalSex: sex })).nutrition!.bmrKcalPerDay;

    const male = await bmr('MALE');
    const female = await bmr('FEMALE');
    const none = await bmr('PREFER_NOT_TO_SAY');

    expect(male - female).toBe(166);
    expect(male - none).toBe(83);
  });

  it('moves the daily goal in the progress and keeps what was already eaten', async () => {
    await createMeal({
      mealType: 'LUNCH',
      consumedAt: new Date().toISOString(),
      items: [{ foodId: 'food-1', amountGrams: 150 }],
    });
    const before = await getProgressToday();
    expect(before.calories.consumed).toBe(192);

    const updated = await updateMyProfile({ currentWeightKg: 60, heightCm: 178 });

    const after = await getProgressToday();
    expect(after.calories.consumed).toBe(192);
    expect(after.calories.goal).toBe(updated.nutrition!.calorieTargetKcalPerDay);
    expect(after.calories.goal).not.toBe(before.calories.goal);
  });

  it('applies the onboarding data to the mock profile', async () => {
    const profile = await updateMyProfile({
      displayName: 'Nicolly',
      dateOfBirth: '1996-09-19',
      biologicalSex: 'FEMALE',
      heightCm: 165,
      currentWeightKg: 68.5,
      goal: 'MAINTAIN',
      activityLevel: 'MODERATE',
    });

    expect(profile.displayName).toBe('Nicolly');
    expect(profile.onboardingCompleted).toBe(true);
    expect(profile.nutrition!.calorieTargetKcalPerDay).toBe(profile.nutrition!.tdeeKcalPerDay);
  });
});
