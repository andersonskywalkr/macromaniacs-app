import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreateMealInput } from '@/api/meals';

const OUTBOX_PREFIX = 'macromaniacs:meals-outbox';

export interface OutboxEntry {
  id: string;
  userId: string;
  idempotencyKey: string;
  input: CreateMealInput;
  createdAt: string;
  attempts: number;
  lastError: string | null;
}

const locks = new Map<string, Promise<unknown>>();

function outboxKey(userId: string): string {
  return `${OUTBOX_PREFIX}:${userId}`;
}

async function readOutbox(userId: string): Promise<OutboxEntry[]> {
  const raw = await AsyncStorage.getItem(outboxKey(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as OutboxEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function updateOutbox(
  userId: string,
  updater: (entries: OutboxEntry[]) => OutboxEntry[],
): Promise<void> {
  const previous = locks.get(userId) ?? Promise.resolve();
  const next = previous.then(async () => {
    const entries = await readOutbox(userId);
    await AsyncStorage.setItem(outboxKey(userId), JSON.stringify(updater(entries)));
  });
  locks.set(userId, next);
  try {
    await next;
  } finally {
    if (locks.get(userId) === next) locks.delete(userId);
  }
}

export async function enqueueOfflineMeal(
  userId: string,
  input: CreateMealInput,
): Promise<void> {
  if (!input.idempotencyKey) {
    throw new Error('Não é possível enfileirar refeição sem chave de idempotência.');
  }
  const idempotencyKey = input.idempotencyKey;
  await updateOutbox(userId, (entries) => {
    if (entries.some((entry) => entry.idempotencyKey === idempotencyKey)) {
      return entries;
    }
    return [
      ...entries,
      {
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId,
        idempotencyKey,
        input,
        createdAt: new Date().toISOString(),
        attempts: 0,
        lastError: null,
      },
    ];
  });
}

export async function getPendingMeals(userId: string): Promise<OutboxEntry[]> {
  return readOutbox(userId);
}

export async function removePendingMeal(userId: string, id: string): Promise<void> {
  await updateOutbox(userId, (entries) => entries.filter((entry) => entry.id !== id));
}

export async function markPendingMealFailure(
  userId: string,
  id: string,
  message: string,
): Promise<void> {
  await updateOutbox(userId, (entries) =>
    entries.map((entry) =>
      entry.id === id
        ? { ...entry, attempts: entry.attempts + 1, lastError: message }
        : entry,
    ),
  );
}
