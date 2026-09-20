import { ApiError } from './ApiError';
import { getAuthErrorMessage } from './authErrors';

function httpError(statusCode: number): ApiError {
  return new ApiError({
    statusCode,
    error: 'Error',
    message: 'backend detail',
    timestamp: new Date(0).toISOString(),
    path: '/v1/auth',
  });
}

describe('authentication error messages', () => {
  it('maps invalid login without revealing account existence', () => {
    expect(getAuthErrorMessage(httpError(401), 'login')).toBe(
      'E-mail/usuário ou senha inválidos.',
    );
  });

  it('maps duplicate registration', () => {
    expect(getAuthErrorMessage(httpError(409), 'register')).toContain(
      'já está em uso',
    );
  });

  it('maps invalid payload', () => {
    expect(getAuthErrorMessage(httpError(400), 'register')).toContain(
      'Confira os dados',
    );
  });

  it('maps server failures', () => {
    expect(getAuthErrorMessage(httpError(500), 'session')).toContain(
      'problema no servidor',
    );
  });

  it('maps network failures', () => {
    const error = new ApiError({ message: 'network detail' });
    expect(getAuthErrorMessage(error, 'login')).toContain(
      'conectar ao servidor',
    );
  });
});
