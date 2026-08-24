import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { mockUserProfile } from '@/mocks/data';
import type { UserProfile } from './types/domain';

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

// GET /api/v1/users/me — seção 49
export async function getMyProfile(): Promise<UserProfile> {
  if (USE_MOCK) {
    return delay(mockUserProfile);
  }
  const { data } = await httpClient.get<UserProfile>('/users/me');
  return data;
}

// PATCH /api/v1/users/me — seção 49, UC-03
export async function updateMyProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
  if (USE_MOCK) {
    return delay({ ...mockUserProfile, ...patch });
  }
  const { data } = await httpClient.patch<UserProfile>('/users/me', patch);
  return data;
}
