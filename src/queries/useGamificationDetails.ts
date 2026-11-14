import { useQuery } from '@tanstack/react-query';
import { getAchievements, getDailyMissions } from '@/api/gamification';
import { currentTimezone } from './userContext';

export const achievementsKey = ['gamification', 'achievements'] as const;
export const missionsKey = ['gamification', 'missions', 'today'] as const;

export function useAchievements() {
  return useQuery({ queryKey: achievementsKey, queryFn: getAchievements });
}

export function useDailyMissions() {
  return useQuery({ queryKey: missionsKey, queryFn: () => getDailyMissions(currentTimezone()), staleTime: 0 });
}
