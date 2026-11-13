import { ApiError } from './ApiError';

// Mensagens de erro de entrar em grupo e de enviar mensagem, em português.
export function getJoinGroupErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Não foi possível entrar no grupo. Tente novamente.';
  if (error.isNetworkError) return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  if (error.statusCode === 404) return 'Código inválido. Confira com quem te convidou.';
  if (error.statusCode === 409) return 'Você já participa deste grupo.';
  if (error.statusCode === 400) return 'Código inválido. Use os 8 caracteres do convite.';
  if (error.statusCode >= 500) return 'Ocorreu um problema no servidor. Tente novamente mais tarde.';
  return 'Não foi possível entrar no grupo. Tente novamente.';
}
