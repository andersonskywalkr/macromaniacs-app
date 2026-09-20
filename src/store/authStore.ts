import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { USE_AUTH_MOCK } from '@/api/config';
import type { UserProfile } from '@/api/types/domain';
import { ApiError } from '@/api/ApiError';
import { getMyProfile } from '@/api/users';
import {
  setApiAccessToken,
  setApiUnauthorizedHandler,
} from '@/api/authSession';
import { queryClient } from '@/queries/queryClient';

// O SecureStore aceita apenas caracteres alfanuméricos, ponto, hífen e
// sublinhado nas chaves. Dois-pontos funcionam no AsyncStorage, mas fazem
// setItemAsync/getItemAsync falhar em dispositivos reais.
const ACCESS_TOKEN_KEY = 'macromaniacs.access-token';

const tokenStorage = {
  async getItem(): Promise<string | null> {
    return USE_AUTH_MOCK
      ? AsyncStorage.getItem(ACCESS_TOKEN_KEY)
      : SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async setItem(value: string): Promise<void> {
    if (USE_AUTH_MOCK) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, value);
      return;
    }

    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, value);
  },
  async deleteItem(): Promise<void> {
    if (USE_AUTH_MOCK) {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  },
};

interface AuthStore {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  accessToken: string | null;
  user: UserProfile | null;
  sessionRestoreError: boolean;

  bootstrap: () => Promise<void>;
  signIn: (accessToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: (profile: UserProfile) => void;
}

async function loadCurrentUser(): Promise<UserProfile> {
  return getMyProfile();
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: 'loading',
  accessToken: null,
  user: null,
  sessionRestoreError: false,

  bootstrap: async () => {
    set({ status: 'loading', sessionRestoreError: false });

    try {
      const token = await tokenStorage.getItem();

      if (!token) {
        setApiAccessToken(null);
        set({
          accessToken: null,
          user: null,
          status: 'unauthenticated',
        });
        return;
      }

      setApiAccessToken(token);
      set({ accessToken: token });

      try {
        const user = await loadCurrentUser();
        set({ user, status: 'authenticated', sessionRestoreError: false });
      } catch (error) {
        // Um 401 é limpo pelo interceptor. Em falha de rede, preservamos o
        // token no SecureStore para permitir nova tentativa depois.
        if (error instanceof ApiError && error.statusCode === 401) {
          await tokenStorage.deleteItem().catch(() => undefined);
          setApiAccessToken(null);
          set({
            accessToken: null,
            user: null,
            status: 'unauthenticated',
            sessionRestoreError: false,
          });
          return;
        }

        if (useAuthStore.getState().accessToken) {
          set({
            user: null,
            status: 'unauthenticated',
            sessionRestoreError: true,
          });
        }
      }
    } catch {
      setApiAccessToken(null);
      set({
        accessToken: null,
        user: null,
        status: 'unauthenticated',
        sessionRestoreError: false,
      });
    }
  },

  signIn: async (accessToken) => {
    await tokenStorage.setItem(accessToken);
    setApiAccessToken(accessToken);
    set({ accessToken, sessionRestoreError: false });

    try {
      const user = await loadCurrentUser();
      set({ user, status: 'authenticated' });
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        await tokenStorage.deleteItem().catch(() => undefined);
        setApiAccessToken(null);
        set({
          accessToken: null,
          user: null,
          status: 'unauthenticated',
          sessionRestoreError: false,
        });
        throw error;
      }

      if (useAuthStore.getState().accessToken) {
        set({ user: null, status: 'unauthenticated', sessionRestoreError: true });
      }
      throw error;
    }
  },

  signOut: async () => {
    setApiAccessToken(null);
    await tokenStorage.deleteItem().catch(() => undefined);
    queryClient.clear();
    set({
      accessToken: null,
      user: null,
      sessionRestoreError: false,
      status: 'unauthenticated',
    });
  },

  completeOnboarding: (profile) => {
    set({ user: profile });
  },
}));

setApiUnauthorizedHandler(() => useAuthStore.getState().signOut());
