import { useQuery } from '@tanstack/react-query';
import { getGamificationStats } from '@/api/gamification';

export const gamificationStatsKey = ['gamification', 'stats'] as const;

export function useGamificationStats() {
  return useQuery({
    queryKey: gamificationStatsKey,
    queryFn: getGamificationStats,
    // Estado de gamificação muda com frequência e depende de regra
    // server-side — não deve ser servido de cache "velho" por padrão
    // (seção 125.3).
    staleTime: 0,
  });
}
