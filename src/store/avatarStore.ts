import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { USE_AUTH_MOCK } from '@/api/config';
import type { UserProfile } from '@/api/types/domain';
import { updateMyProfile } from '@/api/users';
import { myProfileKey } from '@/queries/useMyProfile';
import { queryClient } from '@/queries/queryClient';
import {
  avatarMigrationKey,
  avatarStorageKey,
  isAvatarChoice,
  parseStoredAvatar,
  type AvatarChoice,
} from '@/utils/avatar';
import { useAuthStore } from './authStore';

type AvatarStatus = 'idle' | 'loading' | 'ready' | 'saving';

interface AvatarStore {
  userId: string | null;
  choice: AvatarChoice | null;
  status: AvatarStatus;
  error: string | null;
  remoteSignature: string | null;
  load: (
    userId: string | null,
    remoteAvatar: AvatarChoice | null,
  ) => Promise<void>;
  save: (choice: AvatarChoice | null) => Promise<void>;
  reset: () => void;
}

const MIGRATION_DONE = '1';
let requestVersion = 0;
let activeLoad: { userId: string; promise: Promise<void> } | null = null;
let activeSave: { userId: string; promise: Promise<void> } | null = null;

function signature(choice: AvatarChoice | null): string {
  return choice ? `${choice.style}:${choice.seed}` : 'null';
}

function sameChoice(
  first: AvatarChoice | null,
  second: AvatarChoice | null,
): boolean {
  return signature(first) === signature(second);
}

async function writeCache(
  userId: string,
  choice: AvatarChoice | null,
): Promise<void> {
  if (choice) {
    await AsyncStorage.setItem(
      avatarStorageKey(userId),
      JSON.stringify(choice),
    );
  } else {
    await AsyncStorage.removeItem(avatarStorageKey(userId));
  }
}

async function markMigrationDone(userId: string): Promise<void> {
  await AsyncStorage.setItem(avatarMigrationKey(userId), MIGRATION_DONE);
}

function updateProfileCaches(profile: UserProfile): void {
  if (useAuthStore.getState().user?.id !== profile.id) return;
  useAuthStore.setState({ user: profile });
  queryClient.setQueryData(myProfileKey, profile);
}

export const useAvatarStore = create<AvatarStore>((set, get) => ({
  userId: null,
  choice: null,
  status: 'idle',
  error: null,
  remoteSignature: null,

  load: (userId, remoteAvatar) => {
    if (!userId) {
      requestVersion += 1;
      set({
        userId: null,
        choice: null,
        status: 'idle',
        error: null,
        remoteSignature: null,
      });
      return Promise.resolve();
    }

    const nextSignature = signature(remoteAvatar);
    const current = get();
    if (
      current.userId === userId &&
      current.remoteSignature === nextSignature &&
      current.status !== 'idle'
    ) {
      return activeLoad?.userId === userId
        ? activeLoad.promise
        : Promise.resolve();
    }

    const version = ++requestVersion;
    set({
      userId,
      choice: remoteAvatar,
      status: 'loading',
      error: null,
      remoteSignature: nextSignature,
    });

    const promise = (async () => {
      if (USE_AUTH_MOCK) {
        let local: AvatarChoice | null = null;
        try {
          local = parseStoredAvatar(
            await AsyncStorage.getItem(avatarStorageKey(userId)),
          );
        } catch {
          local = null;
        }
        if (requestVersion === version && get().userId === userId) {
          set({ choice: local, status: 'ready' });
        }
        return;
      }

      if (remoteAvatar) {
        await Promise.all([
          writeCache(userId, remoteAvatar),
          markMigrationDone(userId),
        ]).catch(() => undefined);
        if (requestVersion === version && get().userId === userId) {
          set({ choice: remoteAvatar, status: 'ready' });
        }
        return;
      }

      let migrationDone = false;
      let local: AvatarChoice | null = null;
      try {
        const [marker, raw] = await Promise.all([
          AsyncStorage.getItem(avatarMigrationKey(userId)),
          AsyncStorage.getItem(avatarStorageKey(userId)),
        ]);
        migrationDone = marker === MIGRATION_DONE;
        local = parseStoredAvatar(raw);
      } catch {
        local = null;
      }

      if (requestVersion !== version || get().userId !== userId) return;

      if (migrationDone) {
        await writeCache(userId, null).catch(() => undefined);
        if (requestVersion === version && get().userId === userId) {
          set({ choice: null, status: 'ready' });
        }
        return;
      }

      if (!local) {
        await markMigrationDone(userId).catch(() => undefined);
        if (requestVersion === version && get().userId === userId) {
          set({ choice: null, status: 'ready' });
        }
        return;
      }

      try {
        const profile = await updateMyProfile({ avatar: local });
        if (profile.id !== userId || !sameChoice(profile.avatar, local)) {
          throw new Error('Backend did not confirm the migrated avatar');
        }
        await Promise.all([
          writeCache(userId, local),
          markMigrationDone(userId),
        ]).catch(() => undefined);
        if (requestVersion === version && get().userId === userId) {
          updateProfileCaches(profile);
          set({
            choice: local,
            status: 'ready',
            remoteSignature: signature(local),
          });
        }
      } catch (error) {
        if (requestVersion === version && get().userId === userId) {
          set({
            choice: null,
            status: 'ready',
            error:
              error instanceof Error
                ? error.message
                : 'Não foi possível sincronizar o avatar local.',
          });
        }
      }
    })();

    activeLoad = { userId, promise };
    void promise.then(
      () => {
        if (activeLoad?.promise === promise) activeLoad = null;
      },
      () => {
        if (activeLoad?.promise === promise) activeLoad = null;
      },
    );
    return promise;
  },

  save: (choice) => {
    if (choice !== null && !isAvatarChoice(choice)) {
      return Promise.reject(new Error('Escolha de avatar inválida.'));
    }

    const userId = get().userId;
    if (!userId) {
      return Promise.reject(new Error('Entre novamente para salvar o avatar.'));
    }
    if (activeSave?.userId === userId) return activeSave.promise;

    const promise = (async () => {
      if (activeLoad?.userId === userId) {
        await activeLoad.promise.catch(() => undefined);
      }
      if (get().userId !== userId) return;

      if (USE_AUTH_MOCK) {
        set({ choice, status: 'saving', error: null });
        await writeCache(userId, choice).catch(() => undefined);
        if (get().userId === userId) set({ status: 'ready' });
        return;
      }

      set({ status: 'saving', error: null });
      try {
        const profile = await updateMyProfile({ avatar: choice });
        if (profile.id !== userId || !sameChoice(profile.avatar, choice)) {
          throw new Error('O servidor não confirmou o avatar escolhido.');
        }
        await Promise.all([
          writeCache(userId, choice),
          markMigrationDone(userId),
        ]).catch(() => undefined);
        if (get().userId !== userId) return;

        updateProfileCaches(profile);
        set({
          choice,
          status: 'ready',
          error: null,
          remoteSignature: signature(choice),
        });
      } catch (error) {
        if (get().userId === userId) {
          set({
            status: 'ready',
            error:
              error instanceof Error
                ? error.message
                : 'Não foi possível salvar o avatar.',
          });
        }
        throw error;
      }
    })();

    activeSave = { userId, promise };
    void promise.then(
      () => {
        if (activeSave?.promise === promise) activeSave = null;
      },
      () => {
        if (activeSave?.promise === promise) activeSave = null;
      },
    );
    return promise;
  },

  reset: () => {
    requestVersion += 1;
    set({
      userId: null,
      choice: null,
      status: 'idle',
      error: null,
      remoteSignature: null,
    });
  },
}));

useAuthStore.subscribe((state, previous) => {
  if (!state.user && previous.user) useAvatarStore.getState().reset();
});
