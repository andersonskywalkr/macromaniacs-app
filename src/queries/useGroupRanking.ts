import { useQuery } from '@tanstack/react-query';
import { getGroupRanking } from '@/api/groups';

export function groupRankingKey(groupId: string) {
  return ['groups', groupId, 'ranking'] as const;
}

export function useGroupRanking(groupId: string | undefined) {
  return useQuery({
    queryKey: groupRankingKey(groupId ?? ''),
    queryFn: () => getGroupRanking(groupId as string),
    enabled: Boolean(groupId),
  });
}
