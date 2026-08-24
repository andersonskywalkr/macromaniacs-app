import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from './config';
import { ApiError } from './ApiError';
import { useAuthStore, getRefreshToken } from '@/store/authStore';
import type { ApiErrorShape } from './types/domain';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000, // toda chamada externa precisa de timeout (seção 95)
});

// Injeta o access token em toda requisição autenticada
httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

// Fluxo de refresh de token — seção 120.4:
// 401 -> tenta refresh uma única vez -> repete a requisição original
// -> se o refresh falhar, limpa sessão e deixa o RootNavigator redirecionar
httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorShape>) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // Já existe um refresh em andamento — enfileira e espera
        await new Promise<void>((resolve) => pendingQueue.push(resolve));
        originalRequest._retry = true;
        return httpClient(originalRequest);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('Sem refresh token disponível');

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        useAuthStore.getState().updateAccessToken(data.accessToken);

        pendingQueue.forEach((resolve) => resolve());
        pendingQueue = [];

        return httpClient(originalRequest);
      } catch (refreshError) {
        pendingQueue = [];
        await useAuthStore.getState().signOut();
        return Promise.reject(new ApiError({ message: 'Sessão expirada' }));
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.data) {
      return Promise.reject(new ApiError(error.response.data));
    }
    return Promise.reject(new ApiError({ message: error.message || 'Erro de rede' }));
  },
);
