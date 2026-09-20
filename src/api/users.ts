import { httpClient } from './client';
import { USE_AUTH_MOCK, MOCK_LATENCY_MS } from './config';
import { mockUserProfile } from '@/mocks/data';
import { getMockOnboardingCompleted, setMockOnboardingCompleted } from '@/mocks/mockSession';
import type { UserProfile } from './types/domain';

export type UpdateMyProfileRequest = {
  displayName?: string | null;
  username?: string;
  dateOfBirth?: string | null;
  biologicalSex?: UserProfile['biologicalSex'];
  goal?: UserProfile['goal'];
  activityLevel?: UserProfile['activityLevel'];
  heightCm?: number;
  currentWeightKg?: number;
  targetWeightKg?: number | null;
  targetDate?: string | null;
  dietaryRestrictions?: string | null;
};

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

// GET /api/v1/users/me — seção 49
export async function getMyProfile(): Promise<UserProfile> {
  if (USE_AUTH_MOCK) {
    return delay({ ...mockUserProfile, onboardingCompleted: getMockOnboardingCompleted() });
  }
  const { data } = await httpClient.get<UserProfile>('/v1/users/me');
  return data;
}

// PATCH /api/v1/users/me — seção 49, UC-03
export async function updateMyProfile(
  patch: UpdateMyProfileRequest,
): Promise<UserProfile> {
  if (USE_AUTH_MOCK) {
    setMockOnboardingCompleted(true);
    return delay({
      ...mockUserProfile,
      ...patch,
      onboardingCompleted: true,
    });
  }
  const { data } = await httpClient.patch<UserProfile>('/v1/users/me', patch);
  return data;
}
