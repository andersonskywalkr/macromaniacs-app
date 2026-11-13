import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSearchHistoryStore } from '@/store/searchHistoryStore';

// Histórico de busca do usuário atual (carrega ao entrar na tela).
export function useSearchHistory() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const items = useSearchHistoryStore((state) => state.items);
  const load = useSearchHistoryStore((state) => state.load);
  const add = useSearchHistoryStore((state) => state.add);
  const remove = useSearchHistoryStore((state) => state.remove);
  const clear = useSearchHistoryStore((state) => state.clear);

  useEffect(() => {
    void load(userId);
  }, [userId, load]);

  return { items, add, remove, clear };
}
