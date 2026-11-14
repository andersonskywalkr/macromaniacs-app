import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMeal } from '@/api/meals';
import type { MealLog } from '@/api/types/domain';
import { mealsTodayKey } from './useMealsToday';
import { progressTodayKey } from './useProgressToday';
import { progressHistoryKey } from './useProgressHistory';
import { gamificationStatsKey } from './useGamificationStats';

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMeal,
    onSuccess: (_, mealId) => {
      queryClient.setQueryData<MealLog[]>(mealsTodayKey, (current) =>
        current?.filter((meal) => meal.id !== mealId),
      );
      queryClient.invalidateQueries({ queryKey: mealsTodayKey });
      queryClient.invalidateQueries({ queryKey: progressTodayKey });
      queryClient.invalidateQueries({ queryKey: progressHistoryKey });
      queryClient.invalidateQueries({ queryKey: gamificationStatsKey });
    },
  });
}
