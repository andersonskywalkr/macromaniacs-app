import { useQuery } from '@tanstack/react-query';
import { getMealsToday } from '@/api/meals';

export const mealsTodayKey = ['meals', 'today'] as const;

export function useMealsToday() {
  return useQuery({
    queryKey: mealsTodayKey,
    queryFn: getMealsToday,
  });
}
