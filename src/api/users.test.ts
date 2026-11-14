import { getMyProfile, updateMyProfile } from './users';
import { httpClient } from './client';

jest.mock('./config', () => ({
  MOCK_LATENCY_MS: 0,
  USE_AUTH_MOCK: false,
}));

jest.mock('./client', () => ({
  httpClient: { get: jest.fn(), patch: jest.fn() },
}));

const profile = {
  id: 'user-id',
  email: 'user@example.com',
  username: 'macro_user',
  displayName: null,
  avatar: null,
  dateOfBirth: null,
  biologicalSex: null,
  goal: null,
  activityLevel: null,
  targetWeightKg: null,
  targetDate: null,
  dietaryRestrictions: null,
  onboardingCompleted: false,
  onboardingCompletedAt: null,
  currentMeasurement: null,
  measurements: [],
  nutrition: null,
};

describe('users API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads the authenticated profile from the versioned endpoint', async () => {
    jest.mocked(httpClient.get).mockResolvedValue({ data: profile });

    await expect(getMyProfile()).resolves.toEqual(profile);
    expect(httpClient.get).toHaveBeenCalledWith('/v1/users/me');
  });

  it('submits the exact onboarding contract', async () => {
    const payload = {
      displayName: 'Macro User',
      dateOfBirth: '1996-09-19',
      heightCm: 180,
      currentWeightKg: 80,
      biologicalSex: 'MALE' as const,
      goal: 'LOSE_WEIGHT' as const,
      activityLevel: 'MODERATE' as const,
      targetWeightKg: 75,
      targetDate: '2027-03-01',
      dietaryRestrictions: 'Sem lactose',
    };
    const completed = { ...profile, ...payload, onboardingCompleted: true };
    jest.mocked(httpClient.patch).mockResolvedValue({ data: completed });

    await expect(updateMyProfile(payload)).resolves.toEqual(completed);
    expect(httpClient.patch).toHaveBeenCalledWith('/v1/users/me', payload);
  });

  it('saves and removes the canonical avatar through the profile endpoint', async () => {
    const avatar = { style: 'adventurer', seed: 'abc123xyz789' } as const;
    jest.mocked(httpClient.patch).mockResolvedValueOnce({
      data: { ...profile, avatar },
    });

    await expect(updateMyProfile({ avatar })).resolves.toMatchObject({ avatar });
    expect(httpClient.patch).toHaveBeenLastCalledWith('/v1/users/me', { avatar });

    jest.mocked(httpClient.patch).mockResolvedValueOnce({ data: profile });
    await expect(updateMyProfile({ avatar: null })).resolves.toMatchObject({
      avatar: null,
    });
    expect(httpClient.patch).toHaveBeenLastCalledWith('/v1/users/me', {
      avatar: null,
    });
  });

  it('normalizes a malformed remote avatar to null', async () => {
    jest.mocked(httpClient.get).mockResolvedValue({
      data: {
        ...profile,
        avatar: {
          style: 'adventurer',
          seed: 'abc123xyz789',
          url: 'https://evil.example/avatar.svg',
        },
      },
    });

    await expect(getMyProfile()).resolves.toMatchObject({ avatar: null });
  });
});
