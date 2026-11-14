import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMeal, CreateMealInput } from '@/api/meals';
import type { MealLog } from '@/api/types/domain';
import { ApiError } from '@/api/ApiError';
import { progressTodayKey } from './useProgressToday';
import { progressHistoryKey } from './useProgressHistory';
import { gamificationStatsKey } from './useGamificationStats';
import { mealsTodayKey } from './useMealsToday';
import { enqueueOfflineMeal } from '@/offline/outbox';
import { useAuthStore } from '@/store/authStore';
import { createIdempotencyKey } from '@/api/idempotency';
import { pendingMealsKey } from './usePendingMeals';
import { USE_MOCK } from '@/api/config';

/**
 * Fluxo de registro de refeição (UC-08, seção 127.2):
 *   sucesso -> invalida progress/today e gamification/stats
 *   falha de rede -> cai na fila offline (seção 125.2) em vez de mostrar erro
 */
export function useCreateMeal() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (input: CreateMealInput) => {
      const operationUserId = userId ?? (USE_MOCK ? 'mock-user-id' : null);
      if (!operationUserId) throw new Error('Sessão autenticada obrigatória.');
      input.idempotencyKey ??= createIdempotencyKey('meal', operationUserId);
      return createMeal(input);
    },

    onSuccess: (meal) => {
      // Coloca a refeição nova na lista do dia já, pra o Detalhe abrir sem
      // esperar o refetch (a invalidação abaixo ainda confirma com o servidor).
      queryClient.setQueryData<MealLog[]>(mealsTodayKey, (old) =>
        old && !old.some((m) => m.id === meal.id) ? [...old, meal] : old,
      );
      queryClient.invalidateQueries({ queryKey: progressTodayKey });
      queryClient.invalidateQueries({ queryKey: progressHistoryKey });
      queryClient.invalidateQueries({ queryKey: gamificationStatsKey });
      queryClient.invalidateQueries({ queryKey: mealsTodayKey });
    },

    onError: async (error, input) => {
      const isNetworkError = error instanceof ApiError && error.isNetworkError;
      if (isNetworkError && userId) {
        await enqueueOfflineMeal(userId, input);
        queryClient.invalidateQueries({ queryKey: pendingMealsKey(userId) });
        // A tela deve tratar esse caso mostrando o badge "pendente de
        // sincronização" em vez de um erro — ver seção 125.2.
      }
    },
  });
}
