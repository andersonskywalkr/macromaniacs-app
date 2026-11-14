import { useInfiniteQuery } from '@tanstack/react-query';
import { searchFoodsPage } from '@/api/foods';
import { MIN_FOOD_QUERY_LENGTH } from '@/utils/nutrition';

/**
 * Busca de alimentos. IMPORTANTE: `enabled` deve ser controlado pela tela
 * (ex.: só true depois que o usuário aperta "Buscar"), nunca disparado a
 * cada tecla digitada — regra da seção 28/108 (limite do Open Food Facts).
 */
export function useFoodsSearch(query: string, enabled: boolean) {
  const result = useInfiniteQuery({
    queryKey: ['foods', 'search', query],
    queryFn: ({ pageParam }) => searchFoodsPage(query, { page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage.meta.page ?? 1;
      const totalPages = lastPage.meta.totalPages ?? 1;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: enabled && query.trim().length >= MIN_FOOD_QUERY_LENGTH,
  });
  return { ...result, data: result.data?.pages.flatMap((page) => page.items) };
}
