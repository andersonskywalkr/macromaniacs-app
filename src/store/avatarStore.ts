import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { avatarStorageKey, parseStoredAvatarConfig, type AvatarConfig } from '@/utils/avatarConfig';
import { useAuthStore } from './authStore';

// Avatar personalizado do usuário (estilo Avataaars, gerado no aparelho). Fica
// SÓ neste aparelho (AsyncStorage), numa chave por usuário. LIMITAÇÃO: o
// backend não tem campo de avatar, então a escolha não sincroniza entre
// aparelhos nem aparece para outros membros.
interface AvatarStore {
  userId: string | null;
  config: AvatarConfig | null;
  load: (userId: string | null) => Promise<void>;
  save: (config: AvatarConfig) => Promise<void>;
  // Descarta o que está em memória (logout); o que está guardado continua
  // sob a chave do usuário.
  reset: () => void;
}

export const useAvatarStore = create<AvatarStore>((set, get) => ({
  userId: null,
  config: null,

  load: async (userId) => {
    if (!userId) {
      set({ userId: null, config: null });
      return;
    }
    if (get().userId === userId) return;
    set({ userId, config: null });

    let raw: string | null = null;
    try {
      raw = await AsyncStorage.getItem(avatarStorageKey(userId));
    } catch {
      raw = null;
    }
    // O usuário pode ter mudado (ou salvo um avatar) enquanto lia.
    if (get().userId === userId && get().config === null) set({ config: parseStoredAvatarConfig(raw) });
  },

  save: async (config) => {
    const { userId } = get();
    if (!userId) return;
    set({ config });
    try {
      await AsyncStorage.setItem(avatarStorageKey(userId), JSON.stringify(config));
    } catch {
      // falha ao guardar não pode quebrar a tela: vale nesta sessão
    }
  },

  reset: () => set({ userId: null, config: null }),
}));

// Ao sair da conta, o avatar em memória é descartado.
useAuthStore.subscribe((state, previous) => {
  if (!state.user && previous.user) useAvatarStore.getState().reset();
});
