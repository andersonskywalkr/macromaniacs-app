import { useQuery } from '@tanstack/react-query';
import { getPendingMeals } from '@/offline/outbox';
import { useAuthStore } from '@/store/authStore';

export function pendingMealsKey(userId: string) {
  return ['meals', 'pending', userId] as const;
}

export function usePendingMeals() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: pendingMealsKey(userId ?? ''),
    queryFn: () => getPendingMeals(userId as string),
    enabled: Boolean(userId),
  });
}
