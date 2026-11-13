import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { v1 } from './paths';
import { mockGamificationStats } from '@/mocks/data';
import { fromApiGamificationSummary, type ApiGamificationSummary } from './adapters/progress';
import type { GamificationStats } from './types/domain';

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

// GET /v1/gamification/summary (não existe /gamification/stats).
// totalPoints vira `points`.
export async function getGamificationStats(): Promise<GamificationStats> {
  if (USE_MOCK) {
    return delay(mockGamificationStats);
  }
  const { data } = await httpClient.get<ApiGamificationSummary>(v1('/gamification/summary'));
  return fromApiGamificationSummary(data);
}
