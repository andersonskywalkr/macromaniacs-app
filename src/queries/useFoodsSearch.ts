import { useQuery } from '@tanstack/react-query';
import { searchFoods } from '@/api/foods';

/**
 * Busca de alimentos. IMPORTANTE: `enabled` deve ser controlado pela tela
 * (ex.: só true depois que o usuário aperta "Buscar"), nunca disparado a
 * cada tecla digitada — regra da seção 28/108 (limite do Open Food Facts).
 */
export function useFoodsSearch(query: string, enabled: boolean) {
  return useQuery({
    queryKey: ['foods', 'search', query],
    queryFn: () => searchFoods(query),
    enabled: enabled && query.trim().length > 0,
  });
}
