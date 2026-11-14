import { useQuery } from '@tanstack/react-query';
import { suggestFoods } from '@/api/foods';
import { ApiError } from '@/api/ApiError';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { isSuggestionQuery, SUGGESTION_DEBOUNCE_MS } from '@/utils/foodSuggestions';

// Sugestões enquanto digita: espera uma pausa de 650 ms, busca até 8 e cancela
// a requisição anterior. A chave inclui o texto; respostas antigas nunca viram
// a lista da consulta atual.
export function useFoodSuggestions(text: string) {
  const trimmed = text.trim();
  const debounced = useDebouncedValue(trimmed, SUGGESTION_DEBOUNCE_MS);
  const active = isSuggestionQuery(trimmed) && isSuggestionQuery(debounced);

  const query = useQuery({
    queryKey: ['foods', 'suggest', debounced],
    queryFn: ({ signal }) => suggestFoods(debounced, signal),
    enabled: active,
    staleTime: 60_000,
    retry: false,
  });

  const errorKind: 'network' | 'service' | null = query.isError
    ? query.error instanceof ApiError && query.error.isNetworkError
      ? 'network'
      : 'service'
    : null;

  return {
    suggestions: active ? (query.data?.items ?? []) : [],
    // Pausa de digitação ou requisição em andamento.
    isLoading: active && (query.isFetching || trimmed !== debounced),
    isError: active && query.isError,
    errorKind: active ? errorKind : null,
    isExternalUnavailable: active && query.data?.externalStatus === 'UNAVAILABLE',
    // Já houve resposta para o texto atual (permite dizer "nenhuma sugestão").
    isSettled: active && trimmed === debounced && !query.isFetching && !query.isError,
  };
}
