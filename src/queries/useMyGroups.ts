import { useQuery } from '@tanstack/react-query';
import { getMyGroups } from '@/api/groups';

export const myGroupsKey = ['groups', 'mine'] as const;

export function useMyGroups() {
  return useQuery({
    queryKey: myGroupsKey,
    queryFn: getMyGroups,
  });
}
