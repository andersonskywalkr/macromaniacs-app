import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { mockGroups, mockRanking } from '@/mocks/data';
import type { GroupSummary, RankingEntry } from './types/domain';

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

// GET /api/v1/groups — seção 60
export async function getMyGroups(): Promise<GroupSummary[]> {
  if (USE_MOCK) {
    return delay(mockGroups);
  }
  const { data } = await httpClient.get<GroupSummary[]>('/groups');
  return data;
}

// GET /api/v1/groups/:id/ranking — seção 61
export async function getGroupRanking(groupId: string): Promise<RankingEntry[]> {
  if (USE_MOCK) {
    return delay(mockRanking);
  }
  const { data } = await httpClient.get<RankingEntry[]>(`/groups/${groupId}/ranking`);
  return data;
}

// POST /api/v1/groups/join — seção 60, UC-17
export async function joinGroup(inviteCode: string): Promise<GroupSummary> {
  if (USE_MOCK) {
    return delay(mockGroups[0]);
  }
  const { data } = await httpClient.post<GroupSummary>('/groups/join', { inviteCode });
  return data;
}
