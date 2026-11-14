import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { v1 } from './paths';
import { mockGamificationStats } from '@/mocks/data';
import { fromApiGamificationSummary, type ApiGamificationSummary } from './adapters/progress';
import type { Achievement, DailyMission, GamificationStats } from './types/domain';
import { resolveTimezone, todayInTimezone } from '@/utils/today';

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

const mockAchievements: Achievement[] = [
  {
    id: 'mock-achievement-first-meal',
    code: 'FIRST_MEAL',
    title: 'Primeiro Prato',
    description: 'Registrou a primeira refeição no app.',
    unlockedAt: new Date(0).toISOString(),
  },
];

export async function getAchievements(): Promise<Achievement[]> {
  if (USE_MOCK) return delay(mockAchievements);
  const { data } = await httpClient.get<Achievement[]>(v1('/gamification/achievements'));
  return data;
}

export async function getDailyMissions(timezone?: string | null): Promise<DailyMission[]> {
  const date = todayInTimezone(resolveTimezone(timezone));
  if (USE_MOCK) {
    return delay([
      {
        id: 'mock-mission-meals',
        code: 'LOG_THREE_MEALS',
        title: 'Registrar 3 refeições hoje',
        date,
        currentProgress: 1,
        targetCount: 3,
        pointsReward: 15,
        completed: false,
        rewardGranted: false,
      },
    ]);
  }
  const { data } = await httpClient.get<DailyMission[]>(v1('/gamification/missions'), {
    params: { date },
  });
  return data;
}
