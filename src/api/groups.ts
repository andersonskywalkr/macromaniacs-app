import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { v1 } from './paths';
import { mockGroups, mockRanking } from '@/mocks/data';
import { unwrapItems, type Paginated } from './adapters/common';
import {
  fromApiFeedItem,
  fromApiGroup,
  fromApiRankingEntry,
  type ApiFeedItem,
  type ApiGroup,
  type ApiRankingEntry,
} from './adapters/groups';
import type { GroupFeedItem, GroupSummary, RankingEntry } from './types/domain';

const FEED_PAGE_LIMIT = 50;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

// GET /v1/groups — lista simples (sem memberCount)
export async function getMyGroups(): Promise<GroupSummary[]> {
  if (USE_MOCK) {
    return delay(mockGroups);
  }
  const { data } = await httpClient.get<ApiGroup[]>(v1('/groups'));
  return unwrapItems(data).map(fromApiGroup);
}

// GET /v1/groups/:id/ranking — sem iniciais (calculadas no app)
export async function getGroupRanking(groupId: string): Promise<RankingEntry[]> {
  if (USE_MOCK) {
    return delay(mockRanking);
  }
  const { data } = await httpClient.get<ApiRankingEntry[]>(v1(`/groups/${groupId}/ranking`));
  return unwrapItems(data).map(fromApiRankingEntry);
}

// POST /v1/groups/join — código de 8 caracteres A-Z e 0-9, em maiúsculas
export async function joinGroup(inviteCode: string): Promise<GroupSummary> {
  if (USE_MOCK) {
    return delay(mockGroups[0]);
  }
  const { data } = await httpClient.post<ApiGroup>(v1('/groups/join'), {
    inviteCode: inviteCode.trim().toUpperCase(),
  });
  return fromApiGroup(data);
}

// GET /v1/groups/:id/feed — sem tela ainda
export async function getGroupFeed(groupId: string): Promise<GroupFeedItem[]> {
  if (USE_MOCK) {
    return delay([]);
  }
  const { data } = await httpClient.get<Paginated<ApiFeedItem> | ApiFeedItem[]>(
    v1(`/groups/${groupId}/feed`),
    { params: { limit: FEED_PAGE_LIMIT } },
  );
  return unwrapItems(data).map(fromApiFeedItem);
}
