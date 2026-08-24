import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USE_MOCK } from '@/api/config';

const ACCESS_TOKEN_KEY = 'macromaniacs:access-token';
const REFRESH_TOKEN_KEY = 'macromaniacs:refresh-token';

/**
 * Em modo mock, usamos AsyncStorage em vez de expo-secure-store.
 * Motivo: o secure-store depende do keystore/keychain nativo do
 * aparelho, que pode se comportar de forma instável em alguns
 * emuladores/ambientes de desenvolvimento. Para dados reais (fora do
 * modo mock), o token continua indo para o secure-store, como deve
 * ser em produção.
 */
const tokenStorage = {
  async getItem(key: string): Promise<string | null> {
    return USE_MOCK ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (USE_MOCK) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async deleteItem(key: string): Promise<void> {
    if (USE_MOCK) {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

interface AuthStore {
  // 'loading' = ainda lendo o token salvo no boot; evita renderizar
  // tela autenticada antes da checagem terminar (seção 118.3).
  status: 'loading' | 'authenticated' | 'unauthenticated';
  accessToken: string | null;

  bootstrap: () => Promise<void>;
  signIn: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateAccessToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: 'loading',
  accessToken: null,

  bootstrap: async () => {
    try {
      const token = await tokenStorage.getItem(ACCESS_TOKEN_KEY);
      // Nota: aqui cabe futuramente validar expiração do token (decodificar
      // exp do JWT) antes de decidir authenticated vs unauthenticated.
      set({
        accessToken: token,
        status: token ? 'authenticated' : 'unauthenticated',
      });
    } catch (error) {
      // Se a leitura do token salvo falhar por qualquer motivo, o app
      // NUNCA deve ficar preso em 'loading' pra sempre — cai pra
      // 'unauthenticated' e deixa o usuário logar de novo.
      console.warn('Falha ao ler o token salvo, indo para a tela de login:', error);
      set({ accessToken: null, status: 'unauthenticated' });
    }
  },

  signIn: async ({ accessToken, refreshToken }) => {
    try {
      await tokenStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await tokenStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      // Se salvar o token falhar, o login NÃO deve travar por causa
      // disso — segue autenticado usando o token só em memória.
      console.warn('Falha ao salvar o token (login seguiu em memória):', error);
    }
    set({ accessToken, status: 'authenticated' });
  },

  signOut: async () => {
    try {
      await tokenStorage.deleteItem(ACCESS_TOKEN_KEY);
      await tokenStorage.deleteItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.warn('Falha ao limpar o token salvo:', error);
    }
    set({ accessToken: null, status: 'unauthenticated' });
  },

  updateAccessToken: (accessToken) => {
    tokenStorage.setItem(ACCESS_TOKEN_KEY, accessToken).catch(() => {});
    set({ accessToken });
  },
}));

export async function getRefreshToken(): Promise<string | null> {
  return tokenStorage.getItem(REFRESH_TOKEN_KEY);
}
