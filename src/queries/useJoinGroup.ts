import { useMutation, useQueryClient } from '@tanstack/react-query';
import { joinGroup } from '@/api/groups';
import { myGroupsKey } from './useMyGroups';

// Entrar em um grupo pelo código de convite: depois de entrar, a lista de
// grupos (Grupo e Home) é buscada de novo.
export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteCode: string) => joinGroup(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myGroupsKey });
    },
  });
}
