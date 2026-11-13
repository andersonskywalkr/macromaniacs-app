import { useQuery } from '@tanstack/react-query';
import { getProgressToday } from '@/api/progress';
import { currentCalorieGoal, currentTimezone } from './userContext';

export const progressTodayKey = ['progress', 'today'] as const;

export function useProgressToday() {
  return useQuery({
    queryKey: progressTodayKey,
    queryFn: () => getProgressToday(currentTimezone(), currentCalorieGoal()),
  });
}
