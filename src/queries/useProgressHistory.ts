import { useQuery } from '@tanstack/react-query';
import { getProgressHistory } from '@/api/progress';
import { addDays, buildPerformanceDays, lastDates } from '@/utils/performance';
import { todayInTimezone } from '@/utils/today';
import { currentCalorieGoal, currentTimezone } from './userContext';

export const progressHistoryKey = ['progress', 'history'] as const;

// Semana (7 dias) ou mês (30 dias), terminando hoje no fuso do usuário. O
// resultado já vem com um ponto para CADA dia (dia sem registro = barra
// vazia), no mesmo formato usado pela tela de Histórico e pela Home.
export function usePerformance(days: 7 | 30) {
  return useQuery({
    queryKey: [...progressHistoryKey, days],
    queryFn: async () => {
      const timezone = currentTimezone();
      const today = todayInTimezone(timezone);
      const dates = lastDates(days, today);
      const goal = currentCalorieGoal();
      const entries = await getProgressHistory(addDays(today, -(days - 1)), today, timezone, goal);
      return buildPerformanceDays(dates, entries, goal);
    },
  });
}
