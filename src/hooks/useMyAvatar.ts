import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAvatarStore } from '@/store/avatarStore';

// Avatar do usuário atual (carrega ao usar; o store ignora cargas repetidas).
export function useMyAvatar() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const choice = useAvatarStore((state) => state.choice);
  const load = useAvatarStore((state) => state.load);
  const save = useAvatarStore((state) => state.save);

  useEffect(() => {
    void load(userId);
  }, [userId, load]);

  return { choice, save };
}
