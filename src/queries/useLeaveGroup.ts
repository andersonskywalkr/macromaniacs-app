import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveGroup } from '@/api/groups';
import { myGroupsKey } from './useMyGroups';

export function useLeaveGroup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: leaveGroup,
    onSuccess: (_, groupId) => {
      client.removeQueries({ queryKey: ['groups', groupId] });
      client.invalidateQueries({ queryKey: myGroupsKey });
    },
  });
}
