import { useInfiniteQuery } from '@tanstack/react-query';
import { getGroupFeedPage } from '@/api/groups';

// Atualização automática do chat (a cada 15 s) enquanto a aba Chat está
// aberta e a tela em foco.
export const GROUP_FEED_REFRESH_MS = 15_000;

export function groupFeedKey(groupId: string) {
  return ['groups', groupId, 'feed'] as const;
}

// `live`: true só com a aba Chat aberta E a tela em foco; false para o
// intervalo (ao sair da tela ou trocar de aba).
export function useGroupFeed(groupId: string | undefined, live: boolean) {
  const query = useInfiniteQuery({
    queryKey: groupFeedKey(groupId ?? ''),
    queryFn: ({ pageParam }) => getGroupFeedPage(groupId as string, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage.meta.page ?? 1;
      const totalPages = lastPage.meta.totalPages ?? 1;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: Boolean(groupId),
    refetchInterval: live ? GROUP_FEED_REFRESH_MS : false,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
  return {
    ...query,
    // O backend pagina do mais novo para o mais antigo. A tela ordena os
    // itens cronologicamente, então basta achatar as páginas carregadas.
    data: query.data?.pages.flatMap((page) => page.items),
  };
}
