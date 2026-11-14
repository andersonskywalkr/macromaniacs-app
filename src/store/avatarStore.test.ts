import { avatarStorageKey, defaultAvatarConfig, type AvatarConfig } from '@/utils/avatarConfig';
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

function configWith(skinColor: string): AvatarConfig {
  const base = defaultAvatarConfig();
  return { ...base, options: { ...base.options, skinColor } };
}
const configA = configWith('ffdbb4');
const configB = configWith('614335');

describe('avatarStore', () => {
  beforeEach(() => {
    disk.clear();
    useAvatarStore.getState().reset();
  });

  it('starts empty and saves the configuration under the user key', async () => {
    await useAvatarStore.getState().load('u1');
    expect(useAvatarStore.getState().config).toBeNull();

    await useAvatarStore.getState().save(configA);
    expect(useAvatarStore.getState().config).toEqual(configA);
    expect(JSON.parse(disk.get(avatarStorageKey('u1')) as string)).toEqual(configA);
  });

  it('loads what was saved before (survives closing the app)', async () => {
    disk.set(avatarStorageKey('u1'), JSON.stringify(configA));
    await useAvatarStore.getState().load('u1');
    expect(useAvatarStore.getState().config).toEqual(configA);
  });

  it('keeps one avatar per user on the same device', async () => {
    await useAvatarStore.getState().load('u1');
    await useAvatarStore.getState().save(configA);

    await useAvatarStore.getState().load('u2');
    expect(useAvatarStore.getState().config).toBeNull();
    await useAvatarStore.getState().save(configB);

    await useAvatarStore.getState().load('u1');
    expect(useAvatarStore.getState().config).toEqual(configA);
    expect(JSON.parse(disk.get(avatarStorageKey('u2')) as string)).toEqual(configB);
  });

  it('repairs invalid values when reading, without breaking', async () => {
    disk.set(
      avatarStorageKey('u1'),
      JSON.stringify({ version: 1, style: 'avataaars', options: { top: 'nao-existe', skinColor: 'ffdbb4' } }),
    );
    await useAvatarStore.getState().load('u1');
    const config = useAvatarStore.getState().config;
    expect(config?.options.skinColor).toBe('ffdbb4');
    expect(config?.options.top).toBe(defaultAvatarConfig().options.top);
  });

  it('ignores corrupted data and unknown versions (back to the initials)', async () => {
    disk.set(avatarStorageKey('u1'), '{"version":1');
    await useAvatarStore.getState().load('u1');
    expect(useAvatarStore.getState().config).toBeNull();

    useAvatarStore.getState().reset();
    disk.set(avatarStorageKey('u1'), JSON.stringify({ version: 99, style: 'avataaars', options: {} }));
    await useAvatarStore.getState().load('u1');
    expect(useAvatarStore.getState().config).toBeNull();
  });

  it('does not save without a logged-in user', async () => {
    await useAvatarStore.getState().save(configA);
    expect(useAvatarStore.getState().config).toBeNull();
    expect(disk.size).toBe(0);
  });

  it('drops the avatar from memory on logout, but keeps it stored for the user', async () => {
    await useAvatarStore.getState().load('u1');
    await useAvatarStore.getState().save(configA);

    authListener()({ user: null }, { user: { id: 'u1' } });

    expect(useAvatarStore.getState().config).toBeNull();
    expect(useAvatarStore.getState().userId).toBeNull();
    expect(JSON.parse(disk.get(avatarStorageKey('u1')) as string)).toEqual(configA);

    await useAvatarStore.getState().load('u1');
    expect(useAvatarStore.getState().config).toEqual(configA);
  });
});
