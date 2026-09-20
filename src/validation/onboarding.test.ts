import { INITIAL_ONBOARDING_DATA } from '@/screens/onboarding/types';
import {
  buildOnboardingRequest,
  toIsoDate,
  validateOnboarding,
  validateOnboardingStep,
} from './onboarding';

const validData = {
  ...INITIAL_ONBOARDING_DATA,
  displayName: 'Nicolly',
  birthDate: '19/09/1996',
  heightCm: '165',
  weightKg: '68,5',
  sex: 'FEMALE' as const,
  goal: 'LOSE_WEIGHT' as const,
  activityLevel: 'MODERATE' as const,
  targetWeightKg: '62',
  targetDate: '01/03/2027',
};

describe('onboarding validation', () => {
  const today = new Date('2026-09-19T12:00:00.000Z');

  it('converts a valid Brazilian date to the API format', () => {
    expect(toIsoDate('19/09/1996')).toBe('1996-09-19');
    expect(toIsoDate('31/02/2000')).toBeNull();
  });

  it('accepts the complete valid form', () => {
    expect(validateOnboarding(validData, today)).toBeNull();
  });

  it('builds the exact profile payload expected by the API', () => {
    expect(
      buildOnboardingRequest(
        { ...validData, dietaryRestrictions: '  Sem lactose  ' },
        today,
      ),
    ).toEqual({
      displayName: 'Nicolly',
      dateOfBirth: '1996-09-19',
      heightCm: 165,
      currentWeightKg: 68.5,
      biologicalSex: 'FEMALE',
      goal: 'LOSE_WEIGHT',
      activityLevel: 'MODERATE',
      targetWeightKg: 62,
      targetDate: '2027-03-01',
      dietaryRestrictions: 'Sem lactose',
    });
  });

  it('rejects invalid body measurements', () => {
    expect(
      validateOnboardingStep(0, { ...validData, heightCm: '0' }, today),
    ).toContain('altura');
    expect(
      validateOnboardingStep(0, { ...validData, weightKg: '-1' }, today),
    ).toContain('peso');
  });

  it('requires target weight and target date together', () => {
    expect(
      validateOnboardingStep(
        4,
        { ...validData, targetDate: '' },
        today,
      ),
    ).toContain('juntos');
  });
});
