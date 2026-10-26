import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { getMockProgressToday } from '@/mocks/mealStore';
import type { ProgressToday } from './types/domain';

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

// GET /api/v1/progress/today — seção 55
export async function getProgressToday(): Promise<ProgressToday> {
  if (USE_MOCK) {
    return delay(getMockProgressToday());
  }
  const { data } = await httpClient.get<ProgressToday>('/progress/today');
  return data;
}
