import { ApiError } from './ApiError';

type AuthOperation = 'login' | 'register' | 'session';

export function getAuthErrorMessage(
  error: unknown,
  operation: AuthOperation,
): string {
  if (!(error instanceof ApiError)) {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  if (error.isNetworkError) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  }

  if (error.statusCode >= 500) {
    return 'Ocorreu um problema no servidor. Tente novamente mais tarde.';
  }

  if (error.statusCode === 409 && operation === 'register') {
    return 'E-mail ou nome de usuário já está em uso.';
  }

  if (error.statusCode === 401) {
    return operation === 'login'
      ? 'E-mail/usuário ou senha inválidos.'
      : 'Sua sessão é inválida ou expirou.';
  }

  if (error.statusCode === 400) {
    return 'Confira os dados informados e tente novamente.';
  }

  return 'Não foi possível concluir a solicitação. Tente novamente.';
}

export function getProfileErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Não foi possível salvar seus dados. Tente novamente.';
  }
  if (error.isNetworkError) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  }
  if (error.statusCode === 400) {
    return 'Confira os dados informados e tente novamente.';
  }
  if (error.statusCode === 409) {
    return 'Esse nome de usuário já está em uso.';
  }
  if (error.statusCode === 401) {
    return 'Sua sessão expirou. Entre novamente.';
  }
  if (error.statusCode >= 500) {
    return 'Ocorreu um problema no servidor. Tente novamente mais tarde.';
  }
  return 'Não foi possível salvar seus dados. Tente novamente.';
}
