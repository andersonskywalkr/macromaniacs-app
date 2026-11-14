import { avatarStorageKey } from '@/utils/avatar';
import { useAvatarStore } from './avatarStore';

type Disk = Map<string, string>;
type AuthListener = (state: { user: unknown }, previous: { user: unknown }) => void;

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => (globalThis as unknown as { __disk: Disk }).__disk.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      (globalThis as unknown as { __disk: Disk }).__disk.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      (globalThis as unknown as { __disk: Disk }).__disk.delete(key);
    }),
  },
}));
jest.mock('./authStore', () => ({
  useAuthStore: {
    subscribe: (listener: AuthListener) => {
      (globalThis as unknown as { __authListener: AuthListener }).__authListener = listener;
      return () => undefined;
    },
  },
}));

const disk: Disk = new Map();
(globalThis as unknown as { __disk: Disk }).__disk = disk;
const authListener = () => (globalThis as unknown as { __authListener: AuthListener }).__authListener;

const choiceA = { style: 'adventurer', seed: 'aaaaaaaa1111' } as const;
const choiceB = { style: 'fun-emoji', seed: 'bbbbbbbb2222' } as const;

describe('avatarStore', () => {
  beforeEach(() => {
    disk.clear();
    useAvatarStore.getState().reset();
  });

  it('starts empty and saves the choice under the user key', async () => {
    await useAvatarStore.getState().load('u1');
    expect(useAvatarStore.getState().choice).toBeNull();

    await useAvatarStore.getState().save(choiceA);
    expect(useAvatarStore.getState().choice).toEqual(choiceA);
    expect(JSON.parse(disk.get(avatarStorageKey('u1')) as string)).toEqual(choiceA);
  });

  it('loads what was saved before (survives closing the app)', async () => {
    disk.set(avatarStorageKey('u1'), JSON.stringify(choiceA));
    await useAvatarStore.getState().load('u1');
    expect(useAvatarStore.getState().choice).toEqual(choiceA);
  });

  it('keeps one avatar per user on the same device', async () => {
    await useAvatarStore.getState().load('u1');
    await useAvatarStore.getState().save(choiceA);

    await useAvatarStore.getState().load('u2');
    expect(useAvatarStore.getState().choice).toBeNull();
    await useAvatarStore.getState().save(choiceB);

    await useAvatarStore.getState().load('u1');
    expect(useAvatarStore.getState().choice).toEqual(choiceA);
    expect(JSON.parse(disk.get(avatarStorageKey('u2')) as string)).toEqual(choiceB);
  });

  it('ignores corrupted stored data', async () => {
    disk.set(avatarStorageKey('u1'), '{"style":"x"');
    await useAvatarStore.getState().load('u1');
    expect(useAvatarStore.getState().choice).toBeNull();
  });

  it('does not save without a logged-in user', async () => {
    await useAvatarStore.getState().save(choiceA);
    expect(useAvatarStore.getState().choice).toBeNull();
    expect(disk.size).toBe(0);
  });

  it('drops the avatar from memory on logout, but keeps it stored for the user', async () => {
    await useAvatarStore.getState().load('u1');
    await useAvatarStore.getState().save(choiceA);

    authListener()({ user: null }, { user: { id: 'u1' } });

    expect(useAvatarStore.getState().choice).toBeNull();
    expect(useAvatarStore.getState().userId).toBeNull();
    expect(JSON.parse(disk.get(avatarStorageKey('u1')) as string)).toEqual(choiceA);

    await useAvatarStore.getState().load('u1');
    expect(useAvatarStore.getState().choice).toEqual(choiceA);
  });
});
