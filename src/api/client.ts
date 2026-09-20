import axios, { AxiosError, type AxiosInstance } from 'axios';
import { API_BASE_URL } from './config';
import { ApiError } from './ApiError';
import type { ApiErrorShape } from './types/domain';
import {
  getApiAccessToken,
  handleApiUnauthorized,
} from './authSession';

function createClient(): AxiosInstance {
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mapApiErrors(client: AxiosInstance, clearSessionOn401: boolean): void {
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorShape>) => {
      if (
        clearSessionOn401 &&
        error.response?.status === 401 &&
        getApiAccessToken()
      ) {
        await handleApiUnauthorized();
      }

      if (error.response?.data) {
        return Promise.reject(new ApiError(error.response.data));
      }

      return Promise.reject(
        new ApiError({ message: 'Não foi possível conectar ao servidor.' }),
      );
    },
  );
}

// Cadastro e login nunca recebem um token antigo por engano.
export const publicHttpClient = createClient();
mapApiErrors(publicHttpClient, false);

// Demais chamadas usam o token centralmente e invalidam a sessão em 401.
export const httpClient = createClient();
httpClient.interceptors.request.use((config) => {
  const token = getApiAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
mapApiErrors(httpClient, true);
