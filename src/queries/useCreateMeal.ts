import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMeal, CreateMealInput } from '@/api/meals';
import type { MealLog } from '@/api/types/domain';
import { ApiError } from '@/api/ApiError';
import { progressTodayKey } from './useProgressToday';
import { gamificationStatsKey } from './useGamificationStats';
import { mealsTodayKey } from './useMealsToday';
import { enqueueOfflineMeal } from '@/offline/outbox';

/**
 * Fluxo de registro de refeição (UC-08, seção 127.2):
 *   sucesso -> invalida progress/today e gamification/stats
 *   falha de rede -> cai na fila offline (seção 125.2) em vez de mostrar erro
 */
export function useCreateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMealInput) => createMeal(input),

    onSuccess: (meal) => {
      // Coloca a refeição nova na lista do dia já, pra o Detalhe abrir sem
      // esperar o refetch (a invalidação abaixo ainda confirma com o servidor).
      queryClient.setQueryData<MealLog[]>(mealsTodayKey, (old) =>
        old && !old.some((m) => m.id === meal.id) ? [...old, meal] : old,
      );
      queryClient.invalidateQueries({ queryKey: progressTodayKey });
      queryClient.invalidateQueries({ queryKey: gamificationStatsKey });
      queryClient.invalidateQueries({ queryKey: mealsTodayKey });
    },

    onError: async (error, input) => {
      const isNetworkError = error instanceof ApiError && error.isNetworkError;
      if (isNetworkError) {
        await enqueueOfflineMeal(input);
        // A tela deve tratar esse caso mostrando o badge "pendente de
        // sincronização" em vez de um erro — ver seção 125.2.
      }
    },
  });
}
