import NetInfo from '@react-native-community/netinfo';
import type { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/ApiError';
import { createMeal } from '@/api/meals';
import {
  getPendingMeals,
  markPendingMealFailure,
  removePendingMeal,
} from './outbox';
import { progressTodayKey } from '@/queries/useProgressToday';
import { progressHistoryKey } from '@/queries/useProgressHistory';
import { gamificationStatsKey } from '@/queries/useGamificationStats';
import { mealsTodayKey } from '@/queries/useMealsToday';
import { pendingMealsKey } from '@/queries/usePendingMeals';
import { useAuthStore } from '@/store/authStore';

const activeFlushes = new Map<string, Promise<void>>();

function invalidateSyncedData(queryClient: QueryClient, userId: string): void {
  queryClient.invalidateQueries({ queryKey: progressTodayKey });
  queryClient.invalidateQueries({ queryKey: progressHistoryKey });
  queryClient.invalidateQueries({ queryKey: gamificationStatsKey });
  queryClient.invalidateQueries({ queryKey: mealsTodayKey });
  queryClient.invalidateQueries({ queryKey: pendingMealsKey(userId) });
}

async function runFlush(queryClient: QueryClient, userId: string): Promise<void> {
  const pending = await getPendingMeals(userId);
  let synced = false;
  for (const entry of pending) {
    // Um item inválido continua visível para correção, mas não bloqueia outras
    // refeições independentes da mesma fila.
    if (entry.lastError) continue;
    try {
      await createMeal({ ...entry.input, idempotencyKey: entry.idempotencyKey });
      await removePendingMeal(userId, entry.id);
      synced = true;
    } catch (error) {
      if (error instanceof ApiError && error.isNetworkError) break;
      if (error instanceof ApiError && [429, 500, 502, 503, 504].includes(error.statusCode)) break;
      const message = error instanceof Error ? error.message : 'Falha não recuperável';
      await markPendingMealFailure(userId, entry.id, message);
      break;
    }
  }
  if (synced) invalidateSyncedData(queryClient, userId);
}

export function flushOutbox(queryClient: QueryClient, userId: string): Promise<void> {
  const current = activeFlushes.get(userId);
  if (current) return current;
  const operation = runFlush(queryClient, userId).finally(() => {
    if (activeFlushes.get(userId) === operation) activeFlushes.delete(userId);
  });
  activeFlushes.set(userId, operation);
  return operation;
}

export function startOfflineSync(queryClient: QueryClient): () => void {
  let connected = false;
  const tryFlush = () => {
    const userId = useAuthStore.getState().user?.id;
    if (connected && userId) void flushOutbox(queryClient, userId);
  };
  const unsubscribeNetwork = NetInfo.addEventListener((state) => {
    connected = Boolean(state.isConnected);
    tryFlush();
  });
  const unsubscribeAuth = useAuthStore.subscribe((state, previous) => {
    if (state.user?.id !== previous.user?.id) tryFlush();
  });
  return () => {
    unsubscribeNetwork();
    unsubscribeAuth();
  }
}
