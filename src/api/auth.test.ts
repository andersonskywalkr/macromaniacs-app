import { getMe, login, register } from './auth';
import { httpClient, publicHttpClient } from './client';

jest.mock('./config', () => ({
  MOCK_LATENCY_MS: 0,
  USE_AUTH_MOCK: false,
}));

jest.mock('./client', () => ({
  httpClient: { get: jest.fn() },
  publicHttpClient: { post: jest.fn() },
}));

const user = {
  id: 'user-id',
  email: 'user@example.com',
  username: 'macro_user',
  termsAccepted: true,
  termsAcceptedAt: new Date(0).toISOString(),
  createdAt: new Date(0).toISOString(),
  profile: { id: 'profile-id' },
};

describe('auth API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends the real login contract', async () => {
    jest.mocked(publicHttpClient.post).mockResolvedValue({
      data: { accessToken: 'jwt' },
    });

    await expect(
      login({ identifier: 'macro_user', password: 'password-123' }),
    ).resolves.toEqual({ accessToken: 'jwt' });

    expect(publicHttpClient.post).toHaveBeenCalledWith('/v1/auth/login', {
      identifier: 'macro_user',
      password: 'password-123',
    });
  });

  it('sends the real registration contract', async () => {
    jest.mocked(publicHttpClient.post).mockResolvedValue({ data: user });

    const input = {
      email: 'user@example.com',
      username: 'macro_user',
      password: 'password-123',
      termsAccepted: true as const,
    };

    await expect(register(input)).resolves.toEqual(user);
    expect(publicHttpClient.post).toHaveBeenCalledWith(
      '/v1/auth/register',
      input,
    );
  });

  it('loads the authenticated user from /me', async () => {
    jest.mocked(httpClient.get).mockResolvedValue({ data: user });

    await expect(getMe()).resolves.toEqual(user);
    expect(httpClient.get).toHaveBeenCalledWith('/v1/auth/me');
  });
});
