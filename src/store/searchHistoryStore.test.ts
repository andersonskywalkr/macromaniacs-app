import { addToHistory, historyStorageKey, parseStoredHistory, removeFromHistory } from '@/utils/searchHistory';
import { useSearchHistoryStore } from './searchHistoryStore';

const disk = new Map<string, string>();
let authListener: (state: { user: unknown }, previous: { user: unknown }) => void = () => undefined;

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => (globalThis as unknown as { __disk: Map<string, string> }).__disk.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      (globalThis as unknown as { __disk: Map<string, string> }).__disk.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      (globalThis as unknown as { __disk: Map<string, string> }).__disk.delete(key);
    }),
  },
}));
jest.mock('./authStore', () => ({
  useAuthStore: {
    subscribe: (listener: (state: { user: unknown }, previous: { user: unknown }) => void) => {
      (globalThis as unknown as { __authListener: unknown }).__authListener = listener;
      return () => undefined;
    },
  },
}));

(globalThis as unknown as { __disk: Map<string, string> }).__disk = disk;

describe('history list rules', () => {
  it('puts the most recent first and does not repeat (ignoring case and accents)', () => {
    let items: string[] = [];
    items = addToHistory(items, 'frango');
    items = addToHistory(items, 'arroz');
    items = addToHistory(items, 'Feijão');
    expect(items).toEqual(['Feijão', 'arroz', 'frango']);

    // repetir move para o topo, com a grafia mais recente
    items = addToHistory(items, 'FEIJAO');
    items = addToHistory(items, 'Frango');
    expect(items).toEqual(['Frango', 'FEIJAO', 'arroz']);
  });

  it('keeps at most 10 items and needs at least 2 characters', () => {
    let items: string[] = [];
    for (let i = 1; i <= 12; i += 1) items = addToHistory(items, `alimento ${i}`);
    expect(items).toHaveLength(10);
    expect(items[0]).toBe('alimento 12');
    expect(items[9]).toBe('alimento 3');

    expect(addToHistory(items, 'a')).toBe(items);
    expect(addToHistory(items, '  ')).toBe(items);
  });

  it('removes one item (ignoring case and accents)', () => {
    expect(removeFromHistory(['Frango', 'Feijão', 'arroz'], 'feijao')).toEqual(['Frango', 'arroz']);
  });

  it('reads stored data safely', () => {
    expect(parseStoredHistory(null)).toEqual([]);
    expect(parseStoredHistory('lixo')).toEqual([]);
    expect(parseStoredHistory('{"a":1}')).toEqual([]);
    expect(parseStoredHistory(JSON.stringify(['a', 1, 'b', 'A']))).toEqual(['a', 'b']);
  });

  it('uses one key per user', () => {
    expect(historyStorageKey('u1')).not.toBe(historyStorageKey('u2'));
  });
});

describe('searchHistoryStore', () => {
  beforeEach(() => {
    disk.clear();
    useSearchHistoryStore.getState().reset();
    authListener = (globalThis as unknown as { __authListener: typeof authListener }).__authListener;
  });

  it('adds, removes and clears, keeping the order', async () => {
    const store = useSearchHistoryStore.getState();
    await store.load('u1');
    await useSearchHistoryStore.getState().add('frango');
    await useSearchHistoryStore.getState().add('arroz');
    expect(useSearchHistoryStore.getState().items).toEqual(['arroz', 'frango']);

    await useSearchHistoryStore.getState().remove('arroz');
    expect(useSearchHistoryStore.getState().items).toEqual(['frango']);

    await useSearchHistoryStore.getState().clear();
    expect(useSearchHistoryStore.getState().items).toEqual([]);
    expect(disk.has(historyStorageKey('u1'))).toBe(false);
  });

  it('persists, and a new session of the same user gets it back', async () => {
    await useSearchHistoryStore.getState().load('u1');
    await useSearchHistoryStore.getState().add('frango grelhado');
    expect(JSON.parse(disk.get(historyStorageKey('u1')) as string)).toEqual(['frango grelhado']);

    useSearchHistoryStore.getState().reset();
    await useSearchHistoryStore.getState().load('u1');
    expect(useSearchHistoryStore.getState().items).toEqual(['frango grelhado']);
  });

  it('keeps each user history separate', async () => {
    await useSearchHistoryStore.getState().load('u1');
    await useSearchHistoryStore.getState().add('frango');

    await useSearchHistoryStore.getState().load('u2');
    expect(useSearchHistoryStore.getState().items).toEqual([]);
    await useSearchHistoryStore.getState().add('arroz');

    await useSearchHistoryStore.getState().load('u1');
    expect(useSearchHistoryStore.getState().items).toEqual(['frango']);
    expect(JSON.parse(disk.get(historyStorageKey('u2')) as string)).toEqual(['arroz']);
  });

  it('does nothing without a user', async () => {
    await useSearchHistoryStore.getState().load(null);
    await useSearchHistoryStore.getState().add('frango');
    expect(useSearchHistoryStore.getState().items).toEqual([]);
    expect(disk.size).toBe(0);
  });

  it('drops the in-memory history on logout, keeping what is stored under the user key', async () => {
    await useSearchHistoryStore.getState().load('u1');
    await useSearchHistoryStore.getState().add('frango');

    authListener({ user: null }, { user: { id: 'u1' } });

    expect(useSearchHistoryStore.getState().items).toEqual([]);
    expect(useSearchHistoryStore.getState().userId).toBeNull();
    expect(JSON.parse(disk.get(historyStorageKey('u1')) as string)).toEqual(['frango']);
  });
});
