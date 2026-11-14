import { httpClient } from './client';
import { ApiError } from './ApiError';
import { MOCK_LATENCY_MS, USE_MOCK } from './config';
import { v1 } from './paths';
import { toNumber } from './adapters/common';
import type { InventoryItem, RewardItem } from './types/domain';

type ApiRewardItem = Omit<RewardItem, 'price'> & { price: number | string };
type ApiInventoryItem = Omit<InventoryItem, 'price'> & { price: number | string };

const mockCatalog: RewardItem[] = [
  { id: 'mock-tag-frango', code: 'GYM_CHICKEN_TAG', name: 'Frango de Academia', description: null, type: 'TAG', price: 50, assetUrl: 'tag_frango' },
  { id: 'mock-frame-purple', code: 'LEGENDARY_PURPLE_FRAME', name: 'Borda Roxa Lendária', description: null, type: 'FRAME', price: 250, assetUrl: 'frame_purple_legend' },
];
let mockBalance = 420;
let mockInventory: InventoryItem[] = [];

const delay = <T>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));

function fromReward(item: ApiRewardItem): RewardItem {
  return { ...item, price: toNumber(item.price) };
}

function fromInventory(item: ApiInventoryItem): InventoryItem {
  return { ...item, price: toNumber(item.price) };
}

export async function getRewardCatalog(): Promise<RewardItem[]> {
  if (USE_MOCK) return delay(mockCatalog);
  const { data } = await httpClient.get<ApiRewardItem[]>(v1('/rewards/catalog'));
  return data.map(fromReward);
}

export async function getRewardBalance(): Promise<number> {
  if (USE_MOCK) return delay(mockBalance);
  const { data } = await httpClient.get<{ balance: number | string }>(v1('/rewards/balance'));
  return toNumber(data.balance);
}

export async function getRewardInventory(): Promise<InventoryItem[]> {
  if (USE_MOCK) return delay(mockInventory);
  const { data } = await httpClient.get<ApiInventoryItem[]>(v1('/rewards/inventory'));
  return data.map(fromInventory);
}

export async function purchaseReward(
  itemId: string,
  idempotencyKey: string,
): Promise<{ item: InventoryItem; balance: number }> {
  if (USE_MOCK) {
    const item = mockCatalog.find((candidate) => candidate.id === itemId);
    if (!item) throw new ApiError({ statusCode: 404, message: 'Recompensa não encontrada', timestamp: new Date().toISOString(), path: '/v1/rewards/purchases' });
    if (mockInventory.some((owned) => owned.id === itemId)) throw new ApiError({ statusCode: 409, message: 'Recompensa já adquirida', timestamp: new Date().toISOString(), path: '/v1/rewards/purchases' });
    if (mockBalance < item.price) throw new ApiError({ statusCode: 409, message: 'Saldo insuficiente', timestamp: new Date().toISOString(), path: '/v1/rewards/purchases' });
    mockBalance -= item.price;
    const inventoryItem: InventoryItem = { ...item, acquiredAt: new Date().toISOString(), isEquipped: false };
    mockInventory = [...mockInventory, inventoryItem];
    return delay({ item: inventoryItem, balance: mockBalance });
  }
  const { data } = await httpClient.post<{ item: ApiInventoryItem; balance: number | string }>(
    v1(`/rewards/purchases/${itemId}`),
    undefined,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  return { item: fromInventory(data.item), balance: toNumber(data.balance) };
}

export async function equipReward(itemId: string): Promise<InventoryItem> {
  if (USE_MOCK) {
    const target = mockInventory.find((item) => item.id === itemId);
    if (!target) throw new ApiError({ statusCode: 404, message: 'Item não adquirido', timestamp: new Date().toISOString(), path: '/v1/rewards/inventory' });
    mockInventory = mockInventory.map((item) => ({
      ...item,
      isEquipped: item.id === itemId || (item.type !== target.type && item.isEquipped),
    }));
    return delay(mockInventory.find((item) => item.id === itemId)!);
  }
  const { data } = await httpClient.put<ApiInventoryItem>(v1(`/rewards/inventory/${itemId}/equip`));
  return fromInventory(data);
}
