import { httpClient, publicHttpClient } from './client';
import { MOCK_LATENCY_MS, USE_AUTH_MOCK } from './config';
import type { CurrentUser } from './types/domain';
import { getMockOnboardingCompleted, setMockOnboardingCompleted } from '@/mocks/mockSession';

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), MOCK_LATENCY_MS),
  );
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  termsAccepted: true;
}

export type RegisterResponse = CurrentUser;

function buildMockCurrentUser(): CurrentUser {
  return {
    id: 'mock-user-id',
    email: 'teste@macromaniacs.com',
    username: 'teste',
    termsAccepted: true,
    termsAcceptedAt: new Date(0).toISOString(),
    createdAt: new Date(0).toISOString(),
    profile: { id: 'mock-profile-id', onboardingCompleted: getMockOnboardingCompleted() },
  };
}

export async function login(input: LoginRequest): Promise<LoginResponse> {
  if (USE_AUTH_MOCK) {
    return delay({ accessToken: 'mock-access-token' });
  }

  const { data } = await publicHttpClient.post<LoginResponse>(
    '/v1/auth/login',
    input,
  );
  return data;
}

export async function register(
  input: RegisterRequest,
): Promise<RegisterResponse> {
  if (USE_AUTH_MOCK) {
    // Cadastro novo -> onboarding pendente, igual ao backend real.
    setMockOnboardingCompleted(false);
    return delay({
      ...buildMockCurrentUser(),
      email: input.email,
      username: input.username,
    });
  }

  const { data } = await publicHttpClient.post<RegisterResponse>(
    '/v1/auth/register',
    input,
  );
  return data;
}

export async function getMe(): Promise<CurrentUser> {
  if (USE_AUTH_MOCK) {
    return delay(buildMockCurrentUser());
  }

  const { data } = await httpClient.get<CurrentUser>('/v1/auth/me');
  return data;
}
