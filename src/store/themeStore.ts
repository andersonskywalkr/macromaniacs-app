import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeStore {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
}

const STORAGE_KEY = 'macromaniacs:theme-preference';

// Preferência de tema não é dado sensível (diferente de token de auth),
// então AsyncStorage puro é aceitável aqui — seção 120.4 reserva o
// secure-store só para credenciais.
export const useThemeStore = create<ThemeStore>((set) => {
  // Carrega preferência salva ao iniciar (fire-and-forget)
  AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      set({ preference: saved });
    }
  });

  return {
    preference: 'system',
    setPreference: (pref) => {
      set({ preference: pref });
      AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {
        // Falha ao persistir preferência não deve quebrar o app —
        // pior caso, volta pro padrão 'system' no próximo boot.
      });
    },
  };
});
