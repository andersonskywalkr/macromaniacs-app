import NetInfo from '@react-native-community/netinfo';
import type { QueryClient } from '@tanstack/react-query';
import { createMeal } from '@/api/meals';
import { getPendingMeals, removePendingMeal } from './outbox';
import { progressTodayKey } from '@/queries/useProgressToday';
import { gamificationStatsKey } from '@/queries/useGamificationStats';

/**
 * Reenvia a fila offline em ordem quando o NetInfo detecta reconexão
 * — seção 125.2. Deve ser chamado uma vez perto da raiz do app
 * (ver src/app/App.tsx).
 */
export function startOfflineSync(queryClient: QueryClient): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      void flushOutbox(queryClient);
    }
  });
  return unsubscribe;
}

async function flushOutbox(queryClient: QueryClient): Promise<void> {
  const pending = await getPendingMeals();
  for (const entry of pending) {
    try {
      await createMeal(entry.input);
      await removePendingMeal(entry.id);
    } catch {
      // Se uma entrada falhar, para o processamento e tenta de novo na
      // próxima reconexão — mantém a ordem da fila (seção 125.2).
      return;
    }
  }
  if (pending.length > 0) {
    queryClient.invalidateQueries({ queryKey: progressTodayKey });
    queryClient.invalidateQueries({ queryKey: gamificationStatsKey });
  }
}
