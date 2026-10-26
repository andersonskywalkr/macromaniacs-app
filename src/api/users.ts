import { httpClient } from './client';
import { USE_AUTH_MOCK, MOCK_LATENCY_MS } from './config';
import { fromApiSex } from './sexMapping';
import { getMockProfile, updateMockProfile } from '@/mocks/mockProfile';
import { getMockOnboardingCompleted, setMockOnboardingCompleted } from '@/mocks/mockSession';
import type { UserProfile } from './types/domain';

export type UpdateMyProfileRequest = {
  displayName?: string | null;
  username?: string;
  dateOfBirth?: string | null;
  // Valor já no formato da API (ver api/sexMapping.ts).
  biologicalSex?: string | null;
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

// O backend devolve `biologicalSex` como texto; o app trabalha com os 3
// valores conhecidos (valor desconhecido vira null).
type ApiUserProfile = Omit<UserProfile, 'biologicalSex'> & { biologicalSex: string | null };

function fromApiProfile(profile: ApiUserProfile): UserProfile {
  return { ...profile, biologicalSex: fromApiSex(profile.biologicalSex) };
}

// GET /api/v1/users/me — seção 49
export async function getMyProfile(): Promise<UserProfile> {
  if (USE_AUTH_MOCK) {
    return delay({ ...getMockProfile(), onboardingCompleted: getMockOnboardingCompleted() });
  }
  const { data } = await httpClient.get<ApiUserProfile>('/v1/users/me');
  return fromApiProfile(data);
}

// PATCH /api/v1/users/me — seção 49, UC-03
export async function updateMyProfile(
  patch: UpdateMyProfileRequest,
): Promise<UserProfile> {
  if (USE_AUTH_MOCK) {
    setMockOnboardingCompleted(true);
    return delay(updateMockProfile(patch));
  }
  const { data } = await httpClient.patch<ApiUserProfile>('/v1/users/me', patch);
  return fromApiProfile(data);
}
