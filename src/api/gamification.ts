import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { mockGamificationStats } from '@/mocks/data';
import type { GamificationStats } from './types/domain';

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

// GET /api/v1/gamification/stats — seção 57
export async function getGamificationStats(): Promise<GamificationStats> {
  if (USE_MOCK) {
    return delay(mockGamificationStats);
  }
  const { data } = await httpClient.get<GamificationStats>('/gamification/stats');
  return data;
}
