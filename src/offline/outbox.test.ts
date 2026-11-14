import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  enqueueOfflineMeal,
  getPendingMeals,
  markPendingMealFailure,
  removePendingMeal,
} from './outbox';

const input = (idempotencyKey: string) => ({
  idempotencyKey,
  mealType: 'LUNCH' as const,
  consumedAt: '2026-11-13T15:00:00.000Z',
  items: [{ foodId: 'food-1', amountGrams: 120 }],
});

describe('meal outbox', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('keeps queues isolated by authenticated user and persists the idempotency key', async () => {
    await enqueueOfflineMeal('user-a', input('meal:user-a:1'));
    await enqueueOfflineMeal('user-b', input('meal:user-b:1'));

    const queueA = await getPendingMeals('user-a');
    const queueB = await getPendingMeals('user-b');

    expect(queueA).toHaveLength(1);
    expect(queueA[0]).toMatchObject({
      userId: 'user-a',
      idempotencyKey: 'meal:user-a:1',
      input: { idempotencyKey: 'meal:user-a:1' },
    });
    expect(queueB).toHaveLength(1);
    expect(queueB[0].userId).toBe('user-b');
  });

  it('deduplicates by idempotency key and only removes an explicitly confirmed entry', async () => {
    await Promise.all([
      enqueueOfflineMeal('user-a', input('meal:user-a:1')),
      enqueueOfflineMeal('user-a', input('meal:user-a:1')),
    ]);
    await enqueueOfflineMeal('user-a', input('meal:user-a:2'));

    const queued = await getPendingMeals('user-a');
    expect(queued).toHaveLength(2);

    await markPendingMealFailure('user-a', queued[0].id, 'dados inválidos');
    const failed = await getPendingMeals('user-a');
    expect(failed[0]).toMatchObject({ attempts: 1, lastError: 'dados inválidos' });

    await removePendingMeal('user-a', queued[1].id);
    expect(await getPendingMeals('user-a')).toEqual([failed[0]]);
  });

  it('rejects entries that cannot be retried idempotently', async () => {
    await expect(
      enqueueOfflineMeal('user-a', {
        mealType: 'LUNCH',
        consumedAt: '2026-11-13T15:00:00.000Z',
        items: [{ foodId: 'food-1', amountGrams: 120 }],
      }),
    ).rejects.toThrow('sem chave de idempotência');
  });
});
