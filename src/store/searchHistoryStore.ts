import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  addToHistory,
  historyStorageKey,
  parseStoredHistory,
  removeFromHistory,
} from '@/utils/searchHistory';
import { useAuthStore } from './authStore';

// Histórico da busca de alimento. Fica SÓ neste aparelho (AsyncStorage), numa
// chave por usuário. LIMITAÇÃO: o backend não tem rota para isso, então o
// histórico não sincroniza entre aparelhos.
interface SearchHistoryStore {
  userId: string | null;
  items: string[];
  load: (userId: string | null) => Promise<void>;
  add: (term: string) => Promise<void>;
  remove: (term: string) => Promise<void>;
  clear: () => Promise<void>;
  // Descarta o que está em memória (logout); o que está guardado continua
  // sob a chave do usuário.
  reset: () => void;
}

async function persist(userId: string, items: string[]): Promise<void> {
  try {
    if (items.length === 0) {
      await AsyncStorage.removeItem(historyStorageKey(userId));
    } else {
      await AsyncStorage.setItem(historyStorageKey(userId), JSON.stringify(items));
    }
  } catch {
    // falha ao guardar não pode quebrar a busca
  }
}

export const useSearchHistoryStore = create<SearchHistoryStore>((set, get) => ({
  userId: null,
  items: [],

  load: async (userId) => {
    if (!userId) {
      set({ userId: null, items: [] });
      return;
    }
    if (get().userId === userId) return;
    set({ userId, items: [] });

    let raw: string | null = null;
    try {
      raw = await AsyncStorage.getItem(historyStorageKey(userId));
    } catch {
      raw = null;
    }
    // O usuário pode ter mudado enquanto lia: só aplica se ainda é o mesmo.
    if (get().userId === userId) set({ items: parseStoredHistory(raw) });
  },

  add: async (term) => {
    const { userId, items } = get();
    if (!userId) return;
    const next = addToHistory(items, term);
    if (next === items) return;
    set({ items: next });
    await persist(userId, next);
  },

  remove: async (term) => {
    const { userId, items } = get();
    if (!userId) return;
    const next = removeFromHistory(items, term);
    set({ items: next });
    await persist(userId, next);
  },

  clear: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ items: [] });
    await persist(userId, []);
  },

  reset: () => set({ userId: null, items: [] }),
}));

// Ao sair da conta, o histórico em memória é descartado.
useAuthStore.subscribe((state, previous) => {
  if (!state.user && previous.user) useSearchHistoryStore.getState().reset();
});
