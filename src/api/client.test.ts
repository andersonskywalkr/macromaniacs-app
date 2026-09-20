import { AxiosError } from 'axios';
import { httpClient, publicHttpClient } from './client';
import {
  setApiAccessToken,
  setApiUnauthorizedHandler,
} from './authSession';

const mockSignOut = jest.fn();

function successfulAdapter() {
  return jest.fn(async (config) => ({
    config,
    data: {},
    headers: {},
    status: 200,
    statusText: 'OK',
  }));
}

describe('HTTP authentication client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setApiAccessToken('jwt-token');
    setApiUnauthorizedHandler(mockSignOut);
  });

  it('adds the Bearer token to authenticated calls', async () => {
    const adapter = successfulAdapter();

    await httpClient.get('/v1/auth/me', { adapter });

    expect(adapter.mock.calls[0][0].headers.Authorization).toBe(
      'Bearer jwt-token',
    );
  });

  it('does not add the token to public calls', async () => {
    const adapter = successfulAdapter();

    await publicHttpClient.post('/v1/auth/login', {}, { adapter });

    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined();
  });

  it('clears the local session after an authenticated 401', async () => {
    const adapter = jest.fn(async (config) => {
      throw new AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        undefined,
        {
          config,
          data: {
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Invalid token',
            timestamp: new Date(0).toISOString(),
            path: '/v1/auth/me',
          },
          headers: {},
          status: 401,
          statusText: 'Unauthorized',
        },
      );
    });

    await expect(
      httpClient.get('/v1/auth/me', { adapter }),
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
