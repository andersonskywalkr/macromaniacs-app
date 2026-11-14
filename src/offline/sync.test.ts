import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/ApiError';
import { createMeal } from '@/api/meals';
import { enqueueOfflineMeal, getPendingMeals } from './outbox';
import { flushOutbox } from './sync';

jest.mock('@/api/meals', () => ({ createMeal: jest.fn() }));

const mockCreateMeal = jest.mocked(createMeal);
const queuedInput = {
  idempotencyKey: 'meal:user-a:stable-key',
  mealType: 'DINNER' as const,
  consumedAt: '2026-11-13T22:00:00.000Z',
  items: [{ foodId: 'food-1', amountGrams: 180 }],
};

describe('offline synchronization', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
  });

  afterEach(() => queryClient.clear());

  it('keeps an uncertain request and retries it with the exact same idempotency key', async () => {
    await enqueueOfflineMeal('user-a', queuedInput);
    mockCreateMeal.mockRejectedValueOnce(new ApiError({ message: 'resposta perdida' }));

    await flushOutbox(queryClient, 'user-a');
    expect(await getPendingMeals('user-a')).toHaveLength(1);

    mockCreateMeal.mockResolvedValueOnce({ id: 'meal-1' } as never);
    await flushOutbox(queryClient, 'user-a');

    expect(mockCreateMeal).toHaveBeenCalledTimes(2);
    expect(mockCreateMeal.mock.calls[0][0].idempotencyKey).toBe('meal:user-a:stable-key');
    expect(mockCreateMeal.mock.calls[1][0].idempotencyKey).toBe('meal:user-a:stable-key');
    expect(await getPendingMeals('user-a')).toEqual([]);
  });

  it('coalesces concurrent flush triggers for the same user', async () => {
    await enqueueOfflineMeal('user-a', queuedInput);
    let release: (value: unknown) => void = () => undefined;
    mockCreateMeal.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }) as never);

    const first = flushOutbox(queryClient, 'user-a');
    const second = flushOutbox(queryClient, 'user-a');
    expect(first).toBe(second);

    release({ id: 'meal-1' });
    await first;
    expect(mockCreateMeal).toHaveBeenCalledTimes(1);
    expect(await getPendingMeals('user-a')).toEqual([]);
  });

  it('marks a non-retryable response without deleting or repeatedly resending it', async () => {
    await enqueueOfflineMeal('user-a', queuedInput);
    mockCreateMeal.mockRejectedValueOnce(new ApiError({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'quantidade inválida',
      timestamp: '2026-11-13T00:00:00.000Z',
      path: '/v1/meals',
    }));

    await flushOutbox(queryClient, 'user-a');
    await flushOutbox(queryClient, 'user-a');

    expect(mockCreateMeal).toHaveBeenCalledTimes(1);
    expect(await getPendingMeals('user-a')).toEqual([
      expect.objectContaining({ attempts: 1, lastError: 'quantidade inválida' }),
    ]);
  });

  it('does not let one invalid entry block a later independent meal', async () => {
    await enqueueOfflineMeal('user-a', queuedInput);
    mockCreateMeal.mockRejectedValueOnce(new ApiError({
      statusCode: 400,
      message: 'quantidade inválida',
      timestamp: '2026-11-13T00:00:00.000Z',
      path: '/v1/meals',
    }));
    await flushOutbox(queryClient, 'user-a');

    await enqueueOfflineMeal('user-a', {
      ...queuedInput,
      idempotencyKey: 'meal:user-a:second-key',
    });
    mockCreateMeal.mockResolvedValueOnce({ id: 'meal-2' } as never);
    await flushOutbox(queryClient, 'user-a');

    expect(mockCreateMeal).toHaveBeenCalledTimes(2);
    expect(mockCreateMeal.mock.calls[1][0].idempotencyKey).toBe('meal:user-a:second-key');
    expect(await getPendingMeals('user-a')).toEqual([
      expect.objectContaining({ idempotencyKey: queuedInput.idempotencyKey, lastError: 'quantidade inválida' }),
    ]);
  });
});
