import type { ApiErrorShape } from './types/domain';

/**
 * Classe única de erro de API, mapeada a partir do formato padronizado
 * do backend (seção 67: statusCode, code, message, timestamp, path).
 * Permite tratamento consistente na UI (toast, banner, retry) sem
 * `if` espalhado por tela — seção 120.3.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly path?: string;

  constructor(shape: ApiErrorShape | { message: string }) {
    super(shape.message);
    this.name = 'ApiError';

    if ('statusCode' in shape) {
      this.statusCode = shape.statusCode;
      this.code = shape.code;
      this.path = shape.path;
    } else {
      // Erro de rede/timeout, sem resposta estruturada do backend
      this.statusCode = 0;
      this.code = 'NETWORK_ERROR';
    }
  }

  get isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR';
  }

  get isAuthError(): boolean {
    return this.statusCode === 401;
  }
}
