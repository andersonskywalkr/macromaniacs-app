import type { UserProfile } from '@/api/types/domain';
import { validateOnboarding, buildOnboardingRequest } from './onboarding';
import { hasFormChanges, isoToBrDate, profileToFormData } from './profileForm';

const profile: UserProfile = {
  id: 'u',
  email: 'a@b.c',
  username: 'anderson',
  displayName: 'Anderson',
  dateOfBirth: '1998-04-12',
  biologicalSex: 'PREFER_NOT_TO_SAY',
  goal: 'LOSE_WEIGHT',
  activityLevel: 'MODERATE',
  targetWeightKg: 75.5,
  targetDate: '2027-03-01',
  dietaryRestrictions: null,
  onboardingCompleted: true,
  onboardingCompletedAt: null,
  currentMeasurement: { id: 'm', heightCm: 178, weightKg: 82.5, measuredAt: '2026-01-01' },
  measurements: [],
  nutrition: null,
};

describe('profileToFormData', () => {
  it('fills the form with the saved profile', () => {
    expect(profileToFormData(profile)).toEqual({
      displayName: 'Anderson',
      birthDate: '12/04/1998',
      heightCm: '178',
      weightKg: '82,5',
      sex: 'PREFER_NOT_TO_SAY',
      goal: 'LOSE_WEIGHT',
      activityLevel: 'MODERATE',
      targetWeightKg: '75,5',
      targetDate: '01/03/2027',
      dietaryRestrictions: '',
    });
  });

  it('handles a profile with empty optional fields', () => {
    const form = profileToFormData({
      ...profile,
      targetWeightKg: null,
      targetDate: null,
      currentMeasurement: null,
      biologicalSex: null,
    });
    expect(form).toMatchObject({ targetWeightKg: '', targetDate: '', weightKg: '', sex: null });
  });

  it('reuses the onboarding validation and request builder', () => {
    const today = new Date('2026-10-21T12:00:00.000Z');
    const form = profileToFormData(profile);
    expect(validateOnboarding(form, today)).toBeNull();
    expect(buildOnboardingRequest(form, today)).toMatchObject({
      dateOfBirth: '1998-04-12',
      heightCm: 178,
      currentWeightKg: 82.5,
      biologicalSex: 'PREFER_NOT_TO_SAY',
    });
    expect(validateOnboarding({ ...form, weightKg: '10' }, today)).toMatch(/peso/);
    expect(validateOnboarding({ ...form, sex: null }, today)).toMatch(/Selecione/);
  });

  it('keeps the 18 to 120 year rule', () => {
    const today = new Date('2026-10-21T12:00:00.000Z');
    const form = profileToFormData(profile);
    expect(validateOnboarding({ ...form, birthDate: '01/01/2015' }, today)).toMatch(/18 e 120/);
  });
});

describe('hasFormChanges', () => {
  const initial = profileToFormData(profile);

  it('is false when nothing changed (surrounding spaces do not count)', () => {
    expect(hasFormChanges(initial, { ...initial })).toBe(false);
    expect(hasFormChanges(initial, { ...initial, displayName: ' Anderson ' })).toBe(false);
  });

  it('is true when any field changes', () => {
    expect(hasFormChanges(initial, { ...initial, weightKg: '80' })).toBe(true);
    expect(hasFormChanges(initial, { ...initial, sex: 'MALE' })).toBe(true);
  });
});

describe('isoToBrDate', () => {
  it('converts ISO dates and tolerates empty values', () => {
    expect(isoToBrDate('2027-03-01T00:00:00.000Z')).toBe('01/03/2027');
    expect(isoToBrDate(null)).toBe('');
  });
});
