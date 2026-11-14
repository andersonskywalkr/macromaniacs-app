import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { v1 } from './paths';
import { ApiError } from './ApiError';
import { getMockProgressToday } from '@/mocks/mealStore';
import { getMockProgressHistory } from '@/mocks/progressHistory';
import { resolveTimezone, todayInTimezone } from '@/utils/today';
import { unwrapItems, type Paginated } from './adapters/common';
import {
  emptyDailyProgress,
  fromApiDailyProgress,
  fromApiProgressDay,
  type ApiDailyProgress,
  type ApiProgressHistoryItem,
} from './adapters/progress';
import type { DailyProgressEntry, ProgressToday } from './types/domain';

// O backend aceita até 100 por página; o histórico do app tem no máximo 30 dias.
const HISTORY_PAGE_LIMIT = 100;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

// GET /v1/progress/daily?date=AAAA-MM-DD (não existe /progress/today).
// `fallbackCalorieGoal`: meta calculada pelo app, usada quando o backend
// devolve targetCalories nulo (ex.: conta antiga sem sexo informado).
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

// GET /v1/progress/history?from=AAAA-MM-DD&to=AAAA-MM-DD&limit= (no máximo
// 100). `fallbackCalorieGoal`: meta do perfil para dias sem meta no backend.
// Datas no fuso do usuário. No mock, dias anteriores são gerados de forma
// determinística e hoje usa o consumo real da sessão.
export async function getProgressHistory(
  from: string,
  to: string,
  timezone?: string | null,
  fallbackCalorieGoal: number | null = null,
): Promise<DailyProgressEntry[]> {
  if (USE_MOCK) {
    const today = todayInTimezone(resolveTimezone(timezone));
    return delay(getMockProgressHistory(from, to, today));
  }

  const { data } = await httpClient.get<Paginated<ApiProgressHistoryItem> | ApiProgressHistoryItem[]>(
    v1('/progress/history'),
    { params: { from, to, limit: HISTORY_PAGE_LIMIT } },
  );
  return unwrapItems(data).map((item) => fromApiProgressDay(item, fallbackCalorieGoal));
}
