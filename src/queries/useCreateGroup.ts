import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGroup } from '@/api/groups';
import { myGroupsKey } from './useMyGroups';

export function useCreateGroup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => client.invalidateQueries({ queryKey: myGroupsKey }),
  });
}
