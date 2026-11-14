import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMealItems } from '@/api/meals';
import type { MealLog } from '@/api/types/domain';
import { mealsTodayKey } from './useMealsToday';
import { progressTodayKey } from './useProgressToday';
import { progressHistoryKey } from './useProgressHistory';
import { gamificationStatsKey } from './useGamificationStats';

export function useUpdateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, items }: {
      mealId: string;
      items: { foodId: string; amountGrams: number }[];
    }) => updateMealItems(mealId, items),
    onSuccess: (updated) => {
      queryClient.setQueryData<MealLog[]>(mealsTodayKey, (current) =>
        current?.map((meal) => (meal.id === updated.id ? updated : meal)),
      );
      queryClient.invalidateQueries({ queryKey: mealsTodayKey });
      queryClient.invalidateQueries({ queryKey: progressTodayKey });
      queryClient.invalidateQueries({ queryKey: progressHistoryKey });
      queryClient.invalidateQueries({ queryKey: gamificationStatsKey });
    },
  });
}
