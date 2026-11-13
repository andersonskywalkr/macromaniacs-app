import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { suggestFoods } from '@/api/foods';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { isSuggestionQuery, SUGGESTION_DEBOUNCE_MS } from '@/utils/foodSuggestions';

// Sugestões enquanto digita: espera uma pausa de ~300 ms, busca até 8 e cancela
// a requisição anterior. O resultado é sempre o do texto mais recente (a chave
// da consulta muda com o texto, então resposta atrasada de texto antigo nunca
// vira a lista). A lista anterior continua na tela enquanto a nova carrega.
export function useFoodSuggestions(text: string) {
  const trimmed = text.trim();
  const debounced = useDebouncedValue(trimmed, SUGGESTION_DEBOUNCE_MS);
  const active = isSuggestionQuery(trimmed) && isSuggestionQuery(debounced);

  const query = useQuery({
    queryKey: ['foods', 'suggest', debounced],
    queryFn: ({ signal }) => suggestFoods(debounced, signal),
    enabled: active,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: false,
  });

  return {
    suggestions: active ? (query.data ?? []) : [],
    // Pausa de digitação ou requisição em andamento.
    isLoading: active && (query.isFetching || trimmed !== debounced),
    isError: active && query.isError,
    // Já houve resposta para o texto atual (permite dizer "nenhuma sugestão").
    isSettled: active && trimmed === debounced && !query.isFetching && !query.isError,
  };
}
