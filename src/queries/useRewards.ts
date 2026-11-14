import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  equipReward,
  getRewardBalance,
  getRewardCatalog,
  getRewardInventory,
  purchaseReward,
} from '@/api/rewards';
import { gamificationStatsKey } from './useGamificationStats';

export const rewardCatalogKey = ['rewards', 'catalog'] as const;
export const rewardBalanceKey = ['rewards', 'balance'] as const;
export const rewardInventoryKey = ['rewards', 'inventory'] as const;

export const useRewardCatalog = () => useQuery({ queryKey: rewardCatalogKey, queryFn: getRewardCatalog });
export const useRewardBalance = () => useQuery({ queryKey: rewardBalanceKey, queryFn: getRewardBalance, staleTime: 0 });
export const useRewardInventory = () => useQuery({ queryKey: rewardInventoryKey, queryFn: getRewardInventory });

function useRefreshRewards() {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: rewardBalanceKey });
    client.invalidateQueries({ queryKey: rewardInventoryKey });
    client.invalidateQueries({ queryKey: gamificationStatsKey });
  };
}

export function usePurchaseReward() {
  const refresh = useRefreshRewards();
  return useMutation({
    mutationFn: ({ itemId, idempotencyKey }: { itemId: string; idempotencyKey: string }) =>
      purchaseReward(itemId, idempotencyKey),
    onSuccess: refresh,
  });
}

export function useEquipReward() {
  const refresh = useRefreshRewards();
  return useMutation({ mutationFn: equipReward, onSuccess: refresh });
}
