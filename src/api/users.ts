import { httpClient } from './client';
import { USE_AUTH_MOCK, MOCK_LATENCY_MS } from './config';
import { fromApiSex } from './sexMapping';
import { getMockProfile, updateMockProfile } from '@/mocks/mockProfile';
import { getMockOnboardingCompleted, setMockOnboardingCompleted } from '@/mocks/mockSession';
import type { UserProfile } from './types/domain';
import { v1 } from './paths';
import { isAvatarChoice, type AvatarChoice } from '@/utils/avatar';

export type UpdateMyProfileRequest = {
  avatar?: AvatarChoice | null;
  displayName?: string | null;
  username?: string;
  dateOfBirth?: string | null;
  // O app só envia FEMALE ou MALE (nunca NOT_INFORMED; ver api/sexMapping.ts).
  biologicalSex?: 'FEMALE' | 'MALE';
  goal?: UserProfile['goal'];
  activityLevel?: UserProfile['activityLevel'];
  heightCm?: number;
  currentWeightKg?: number;
  targetWeightKg?: number | null;
  targetDate?: string | null;
  dietaryRestrictions?: string | null;
  // Fuso do aparelho (nome IANA); define o "hoje" do backend.
  timezone?: string;
};

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

// O backend devolve `biologicalSex` como texto; o app trabalha com FEMALE e
// MALE (NOT_INFORMED, ausente ou desconhecido vira null: perfil sem sexo).
type ApiUserProfile = Omit<UserProfile, 'avatar' | 'biologicalSex'> & {
  avatar?: unknown;
  biologicalSex: string | null;
};

function fromApiProfile(profile: ApiUserProfile): UserProfile {
  return {
    ...profile,
    avatar: isAvatarChoice(profile.avatar) ? profile.avatar : null,
    biologicalSex: fromApiSex(profile.biologicalSex),
  };
}

// GET /api/v1/users/me — seção 49
export async function getMyProfile(): Promise<UserProfile> {
  if (USE_AUTH_MOCK) {
    return delay({ ...getMockProfile(), onboardingCompleted: getMockOnboardingCompleted() });
  }
  const { data } = await httpClient.get<ApiUserProfile>(v1('/users/me'));
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
  // Defesa extra: NOT_INFORMED (ou qualquer valor fora de FEMALE/MALE) nunca
  // vai ao backend; o campo é simplesmente omitido.
  const { biologicalSex, ...rest } = patch;
  const body: UpdateMyProfileRequest =
    biologicalSex === 'FEMALE' || biologicalSex === 'MALE' ? { ...rest, biologicalSex } : rest;
  const { data } = await httpClient.patch<ApiUserProfile>(v1('/users/me'), body);
  return fromApiProfile(data);
}
