import { ApiError } from './ApiError';

describe('ApiError', () => {
  it('turns a list of validation messages into readable text', () => {
    const error = new ApiError({
      statusCode: 400,
      error: 'Bad Request',
      message: ['name must be shorter than or equal to 100 characters', 'items must contain at least 1 elements'],
      timestamp: '2026-10-22T10:00:00.000Z',
      path: '/v1/meals/manual',
      correlationId: 'abc-123',
    });

    expect(error.message).toBe(
      'name must be shorter than or equal to 100 characters; items must contain at least 1 elements',
    );
    expect(error.statusCode).toBe(400);
  });

  it('keeps a plain text message and the network error format', () => {
    expect(new ApiError({ statusCode: 409, message: 'Conflito', timestamp: '', path: '' }).message).toBe('Conflito');
    expect(new ApiError({ message: 'Sem rede' }).isNetworkError).toBe(true);
  });
});
