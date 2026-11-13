import { requestPasswordReset } from './auth';
import { httpClient, publicHttpClient } from './client';

// Modo mock de autenticação: simula o fluxo, sem chamar o backend.
jest.mock('./config', () => ({
  MOCK_LATENCY_MS: 0,
  USE_AUTH_MOCK: true,
}));
jest.mock('./client', () => ({
  httpClient: { get: jest.fn(), post: jest.fn() },
  publicHttpClient: { post: jest.fn() },
}));

describe('password reset (mock auth)', () => {
  it('simulates the flow and never touches the network', async () => {
    await expect(requestPasswordReset('ana@exemplo.com')).resolves.toEqual({ simulated: true });
    expect(publicHttpClient.post).not.toHaveBeenCalled();
    expect(httpClient.post).not.toHaveBeenCalled();
  });
});
