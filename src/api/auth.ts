import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// POST /api/v1/auth/login — seção 48, UC-02
export async function login(email: string, password: string): Promise<AuthTokens> {
  if (USE_MOCK) {
    // No mock, qualquer email/senha não vazios "funcionam" — é só pra
    // desenvolver a UI sem backend. A validação real (senha errada,
    // usuário não existe) só existe quando USE_MOCK=false.
    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }
    return delay({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' });
  }
  const { data } = await httpClient.post<AuthTokens>('/auth/login', { email, password });
  return data;
}

// POST /api/v1/auth/register — seção 48, UC-01
export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

export async function register(input: RegisterInput): Promise<AuthTokens> {
  if (USE_MOCK) {
    return delay({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' });
  }
  const { data } = await httpClient.post<AuthTokens>('/auth/register', input);
  return data;
}

// POST /api/v1/auth/logout — seção 48
export async function logout(): Promise<void> {
  if (USE_MOCK) {
    return delay(undefined);
  }
  await httpClient.post('/auth/logout');
}
