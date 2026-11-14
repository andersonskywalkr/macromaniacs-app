import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { avatarStorageKey, parseStoredAvatar, type AvatarChoice } from '@/utils/avatar';
import { useAuthStore } from './authStore';

// Avatar de desenho do usuário. Fica SÓ neste aparelho (AsyncStorage), numa
// chave por usuário. LIMITAÇÃO: o backend não tem campo de avatar, então a
// escolha não sincroniza entre aparelhos nem aparece para outros membros.
interface AvatarStore {
  userId: string | null;
  choice: AvatarChoice | null;
  load: (userId: string | null) => Promise<void>;
  save: (choice: AvatarChoice) => Promise<void>;
  // Descarta o que está em memória (logout); o que está guardado continua
  // sob a chave do usuário.
  reset: () => void;
}

export const useAvatarStore = create<AvatarStore>((set, get) => ({
  userId: null,
  choice: null,

  load: async (userId) => {
    if (!userId) {
      set({ userId: null, choice: null });
      return;
    }
    if (get().userId === userId) return;
    set({ userId, choice: null });

    let raw: string | null = null;
    try {
      raw = await AsyncStorage.getItem(avatarStorageKey(userId));
    } catch {
      raw = null;
    }
    // O usuário pode ter mudado (ou escolhido um avatar) enquanto lia.
    if (get().userId === userId && get().choice === null) set({ choice: parseStoredAvatar(raw) });
  },

  save: async (choice) => {
    const { userId } = get();
    if (!userId) return;
    set({ choice });
    try {
      await AsyncStorage.setItem(avatarStorageKey(userId), JSON.stringify(choice));
    } catch {
      // falha ao guardar não pode quebrar a tela: vale nesta sessão
    }
  },

  reset: () => set({ userId: null, choice: null }),
}));

// Ao sair da conta, o avatar em memória é descartado.
useAuthStore.subscribe((state, previous) => {
  if (!state.user && previous.user) useAvatarStore.getState().reset();
});
