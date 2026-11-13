import { useQuery } from '@tanstack/react-query';
import { getGroupFeed } from '@/api/groups';

// Atualização automática do chat (a cada 15 s) enquanto a aba Chat está
// aberta e a tela em foco.
export const GROUP_FEED_REFRESH_MS = 15_000;

export function groupFeedKey(groupId: string) {
  return ['groups', groupId, 'feed'] as const;
}

// `live`: true só com a aba Chat aberta E a tela em foco; false para o
// intervalo (ao sair da tela ou trocar de aba).
export function useGroupFeed(groupId: string | undefined, live: boolean) {
  return useQuery({
    queryKey: groupFeedKey(groupId ?? ''),
    queryFn: () => getGroupFeed(groupId as string),
    enabled: Boolean(groupId),
    refetchInterval: live ? GROUP_FEED_REFRESH_MS : false,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}
