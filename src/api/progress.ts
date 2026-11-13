import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { v1 } from './paths';
import { ApiError } from './ApiError';
import { getMockProgressToday } from '@/mocks/mealStore';
import { resolveTimezone, todayInTimezone } from '@/utils/today';
import {
  emptyDailyProgress,
  fromApiDailyProgress,
  type ApiDailyProgress,
} from './adapters/progress';
import type { ProgressToday } from './types/domain';

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

// GET /v1/progress/daily?date=AAAA-MM-DD (não existe /progress/today).
// `fallbackCalorieGoal`: meta calculada pelo app, usada quando o backend
// devolve targetCalories nulo (ex.: quem escolheu "Prefiro não informar").
export async function getProgressToday(
  timezone?: string | null,
  fallbackCalorieGoal: number | null = null,
): Promise<ProgressToday> {
  if (USE_MOCK) {
    return delay(getMockProgressToday());
  }

  const date = todayInTimezone(resolveTimezone(timezone));
  try {
    const { data } = await httpClient.get<ApiDailyProgress | null>(v1('/progress/daily'), {
      params: { date },
    });
    return data ? fromApiDailyProgress(data, fallbackCalorieGoal) : emptyDailyProgress(fallbackCalorieGoal);
  } catch (error) {
    // Dia sem refeições: consumo zero.
    if (error instanceof ApiError && error.statusCode === 404) {
      return emptyDailyProgress(fallbackCalorieGoal);
    }
    throw error;
  }
}
