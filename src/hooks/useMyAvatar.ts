import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAvatarStore } from '@/store/avatarStore';

// Avatar do usuário atual (carrega ao usar; o store ignora cargas repetidas).
export function useMyAvatar() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const config = useAvatarStore((state) => state.config);
  const load = useAvatarStore((state) => state.load);
  const save = useAvatarStore((state) => state.save);

  useEffect(() => {
    void load(userId);
  }, [userId, load]);

  return { config, save };
}
