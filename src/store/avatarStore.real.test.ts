import type { UserProfile } from '@/api/types/domain';
import {
  avatarMigrationKey,
  avatarStorageKey,
  type AvatarChoice,
} from '@/utils/avatar';
import { useAvatarStore } from './avatarStore';

type Disk = Map<string, string>;

const mockDisk: Disk = new Map();
const mockUpdateMyProfile = jest.fn();
const mockSetQueryData = jest.fn();
const mockAuthHarness = {
  state: { user: null as UserProfile | null },
};
(
  globalThis as unknown as { __avatarAuthHarness: typeof mockAuthHarness }
).__avatarAuthHarness = mockAuthHarness;

jest.mock('@/api/config', () => ({ USE_AUTH_MOCK: false }));
jest.mock('@/api/users', () => ({
  updateMyProfile: (patch: unknown) => mockUpdateMyProfile(patch),
}));
jest.mock('@/queries/queryClient', () => ({
  queryClient: {
    setQueryData: (...args: unknown[]) => mockSetQueryData(...args),
  },
}));
jest.mock('./authStore', () => {
  const harness = () =>
    (globalThis as unknown as { __avatarAuthHarness: typeof mockAuthHarness })
      .__avatarAuthHarness;
  return {
    useAuthStore: {
      getState: () => harness().state,
      setState: (patch: { user?: UserProfile | null }) => {
        harness().state = { ...harness().state, ...patch };
      },
      subscribe: jest.fn(() => () => undefined),
    },
  };
});
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockDisk.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      mockDisk.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      mockDisk.delete(key);
    }),
  },
}));

const avatarA = { style: 'adventurer', seed: 'aaaaaaaa1111' } as const;
const avatarB = { style: 'fun-emoji', seed: 'bbbbbbbb2222' } as const;

function profile(id: string, avatar: AvatarChoice | null): UserProfile {
  return {
    id,
    email: `${id}@example.com`,
    username: id,
    displayName: id,
    avatar,
    dateOfBirth: null,
    biologicalSex: null,
    goal: null,
    activityLevel: null,
    targetWeightKg: null,
    targetDate: null,
    dietaryRestrictions: null,
    onboardingCompleted: false,
    onboardingCompletedAt: null,
    currentMeasurement: null,
    measurements: [],
    nutrition: null,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('avatarStore (real backend mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDisk.clear();
    mockAuthHarness.state = { user: null };
    useAvatarStore.getState().reset();
  });

  it('uses the remote avatar as source of truth and refreshes its cache', async () => {
    mockDisk.set(avatarStorageKey('u1'), JSON.stringify(avatarB));
    mockAuthHarness.state = { user: profile('u1', avatarA) };

    await useAvatarStore.getState().load('u1', avatarA);

    expect(useAvatarStore.getState().choice).toEqual(avatarA);
    expect(mockUpdateMyProfile).not.toHaveBeenCalled();
    expect(JSON.parse(mockDisk.get(avatarStorageKey('u1'))!)).toEqual(avatarA);
    expect(mockDisk.get(avatarMigrationKey('u1'))).toBe('1');
  });

  it('migrates a valid local choice once when the remote profile is empty', async () => {
    mockDisk.set(avatarStorageKey('u1'), JSON.stringify(avatarA));
    mockAuthHarness.state = { user: profile('u1', null) };
    mockUpdateMyProfile.mockResolvedValue(profile('u1', avatarA));

    await useAvatarStore.getState().load('u1', null);

    expect(mockUpdateMyProfile).toHaveBeenCalledTimes(1);
    expect(mockUpdateMyProfile).toHaveBeenCalledWith({ avatar: avatarA });
    expect(useAvatarStore.getState().choice).toEqual(avatarA);
    expect(mockDisk.get(avatarMigrationKey('u1'))).toBe('1');
    expect(mockAuthHarness.state.user?.avatar).toEqual(avatarA);
    expect(mockSetQueryData).toHaveBeenCalledTimes(1);

    useAvatarStore.getState().reset();
    mockAuthHarness.state = { user: profile('u1', null) };
    await useAvatarStore.getState().load('u1', null);
    expect(mockUpdateMyProfile).toHaveBeenCalledTimes(1);
  });

  it('preserves local data and leaves migration pending after a network failure', async () => {
    mockDisk.set(avatarStorageKey('u1'), JSON.stringify(avatarA));
    mockAuthHarness.state = { user: profile('u1', null) };
    mockUpdateMyProfile.mockRejectedValue(new Error('network'));

    await useAvatarStore.getState().load('u1', null);

    expect(useAvatarStore.getState().choice).toBeNull();
    expect(mockDisk.get(avatarStorageKey('u1'))).toBe(JSON.stringify(avatarA));
    expect(mockDisk.has(avatarMigrationKey('u1'))).toBe(false);
  });

  it('waits for server confirmation, updates caches and deduplicates save taps', async () => {
    const response = deferred<UserProfile>();
    mockAuthHarness.state = { user: profile('u1', null) };
    await useAvatarStore.getState().load('u1', null);
    mockUpdateMyProfile.mockReturnValue(response.promise);

    const first = useAvatarStore.getState().save(avatarA);
    const duplicate = useAvatarStore.getState().save(avatarA);
    expect(useAvatarStore.getState().choice).toBeNull();
    expect(mockUpdateMyProfile).toHaveBeenCalledTimes(1);

    response.resolve(profile('u1', avatarA));
    await Promise.all([first, duplicate]);

    expect(useAvatarStore.getState().choice).toEqual(avatarA);
    expect(mockAuthHarness.state.user?.avatar).toEqual(avatarA);
    expect(JSON.parse(mockDisk.get(avatarStorageKey('u1'))!)).toEqual(avatarA);
  });

  it('does not let an old account response overwrite the new account', async () => {
    const response = deferred<UserProfile>();
    mockDisk.set(avatarStorageKey('u1'), JSON.stringify(avatarA));
    mockAuthHarness.state = { user: profile('u1', null) };
    mockUpdateMyProfile.mockReturnValue(response.promise);

    const oldLoad = useAvatarStore.getState().load('u1', null);
    await Promise.resolve();
    mockAuthHarness.state = { user: profile('u2', avatarB) };
    await useAvatarStore.getState().load('u2', avatarB);
    response.resolve(profile('u1', avatarA));
    await oldLoad;

    expect(useAvatarStore.getState()).toMatchObject({
      userId: 'u2',
      choice: avatarB,
    });
    expect(mockAuthHarness.state.user?.id).toBe('u2');
  });

  it('keeps the confirmed choice when saving fails and can remove it later', async () => {
    mockAuthHarness.state = { user: profile('u1', avatarA) };
    await useAvatarStore.getState().load('u1', avatarA);
    mockUpdateMyProfile.mockRejectedValueOnce(new Error('offline'));

    await expect(useAvatarStore.getState().save(avatarB)).rejects.toThrow(
      'offline',
    );
    expect(useAvatarStore.getState().choice).toEqual(avatarA);

    mockUpdateMyProfile.mockResolvedValueOnce(profile('u1', null));
    await useAvatarStore.getState().save(null);
    expect(useAvatarStore.getState().choice).toBeNull();
    expect(mockDisk.has(avatarStorageKey('u1'))).toBe(false);
  });
});
