import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USE_MOCK } from '@/api/config';

const ACCESS_TOKEN_KEY = 'macromaniacs:access-token';
const REFRESH_TOKEN_KEY = 'macromaniacs:refresh-token';
// Flag local — não sensível, então sempre em AsyncStorage (como a
// preferência de tema). O backend ainda não expõe se o onboarding foi
// concluído (não há esse campo no Swagger/seção 120.2 ainda), então isso é
// um controle só do cliente: true logo após cadastro, false ao concluir o
// wizard (ver OnboardingScreen). Login normal não mexe nesse valor —
// preserva o estado anterior, então um cadastro interrompido retoma o
// onboarding no próximo login.
const NEEDS_ONBOARDING_KEY = 'macromaniacs:needs-onboarding';

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
  needsOnboarding: boolean;

  bootstrap: () => Promise<void>;
  signIn: (
    tokens: { accessToken: string; refreshToken: string },
    options?: { needsOnboarding?: boolean },
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateAccessToken: (accessToken: string) => void;
  completeOnboarding: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  status: 'loading',
  accessToken: null,
  needsOnboarding: false,

  bootstrap: async () => {
    try {
      const [token, needsOnboardingRaw] = await Promise.all([
        tokenStorage.getItem(ACCESS_TOKEN_KEY),
        AsyncStorage.getItem(NEEDS_ONBOARDING_KEY),
      ]);
      // Nota: aqui cabe futuramente validar expiração do token (decodificar
      // exp do JWT) antes de decidir authenticated vs unauthenticated.
      set({
        accessToken: token,
        needsOnboarding: needsOnboardingRaw === 'true',
        status: token ? 'authenticated' : 'unauthenticated',
      });
    } catch (error) {
      // Se a leitura do token salvo falhar por qualquer motivo, o app
      // NUNCA deve ficar preso em 'loading' pra sempre — cai pra
      // 'unauthenticated' e deixa o usuário logar de novo.
      console.warn('Falha ao ler o token salvo, indo para a tela de login:', error);
      set({ accessToken: null, needsOnboarding: false, status: 'unauthenticated' });
    }
  },

  signIn: async ({ accessToken, refreshToken }, options) => {
    try {
      await tokenStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await tokenStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      // Se salvar o token falhar, o login NÃO deve travar por causa
      // disso — segue autenticado usando o token só em memória.
      console.warn('Falha ao salvar o token (login seguiu em memória):', error);
    }

    const needsOnboarding = options?.needsOnboarding ?? get().needsOnboarding;
    if (options?.needsOnboarding !== undefined) {
      await AsyncStorage.setItem(NEEDS_ONBOARDING_KEY, String(options.needsOnboarding)).catch(() => {});
    }
    set({ accessToken, needsOnboarding, status: 'authenticated' });
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

  completeOnboarding: async () => {
    await AsyncStorage.setItem(NEEDS_ONBOARDING_KEY, 'false').catch(() => {});
    set({ needsOnboarding: false });
  },
}));

export async function getRefreshToken(): Promise<string | null> {
  return tokenStorage.getItem(REFRESH_TOKEN_KEY);
}
