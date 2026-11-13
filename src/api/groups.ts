import { httpClient } from './client';
import { USE_MOCK, MOCK_LATENCY_MS } from './config';
import { v1 } from './paths';
import { ApiError } from './ApiError';
import {
  addMockMessage,
  getMockFeed,
  getMockGroupRanking,
  getMockGroups,
  joinMockGroup,
} from '@/mocks/groupsData';
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

function mockError(statusCode: number, message: string, path: string): ApiError {
  return new ApiError({ statusCode, message, timestamp: new Date().toISOString(), path });
}

// GET /v1/groups — lista simples (sem memberCount: o app usa o tamanho do
// ranking de cada grupo; no mock, o memberCount da fonte única).
export async function getMyGroups(): Promise<GroupSummary[]> {
  if (USE_MOCK) {
    return delay(getMockGroups());
  }
  const { data } = await httpClient.get<ApiGroup[]>(v1('/groups'));
  return unwrapItems(data).map(fromApiGroup);
}

// GET /v1/groups/:id/ranking — sem iniciais (calculadas no app). No mock é
// ordenado por pontos, com desempate pela sequência (utils/ranking.ts).
export async function getGroupRanking(groupId: string): Promise<RankingEntry[]> {
  if (USE_MOCK) {
    return delay(getMockGroupRanking(groupId));
  }
  const { data } = await httpClient.get<ApiRankingEntry[]>(v1(`/groups/${groupId}/ranking`));
  return unwrapItems(data).map(fromApiRankingEntry);
}

// POST /v1/groups/join — código de 8 caracteres A-Z e 0-9, em maiúsculas.
// No mock: código inválido = 404 e grupo que já participa = 409.
export async function joinGroup(inviteCode: string): Promise<GroupSummary> {
  const code = inviteCode.trim().toUpperCase();
  if (USE_MOCK) {
    const result = joinMockGroup(code);
    if (result.status === 'invalid') {
      throw mockError(404, 'Código inválido', '/v1/groups/join');
    }
    if (result.status === 'already-member') {
      throw mockError(409, 'Você já participa deste grupo', '/v1/groups/join');
    }
    return delay(result.group);
  }
  const { data } = await httpClient.post<ApiGroup>(v1('/groups/join'), { inviteCode: code });
  return fromApiGroup(data);
}

// GET /v1/groups/:id/feed — o chat do grupo (cada mensagem é uma postagem).
// Sem paginação (o `meta` não foi confirmado): lê só a primeira página.
export async function getGroupFeed(groupId: string): Promise<GroupFeedItem[]> {
  if (USE_MOCK) {
    return delay(getMockFeed(groupId));
  }
  const { data } = await httpClient.get<Paginated<ApiFeedItem> | ApiFeedItem[]>(
    v1(`/groups/${groupId}/feed`),
    { params: { limit: FEED_PAGE_LIMIT } },
  );
  return unwrapItems(data).map(fromApiFeedItem);
}

// POST /v1/groups/:id/feed com { content } (1 a 2000 caracteres). Só esse
// campo: o backend recusa campos extras (400).
export async function sendGroupMessage(groupId: string, content: string): Promise<GroupFeedItem> {
  const text = content.trim();
  if (USE_MOCK) {
    return delay(addMockMessage(groupId, text));
  }
  const { data } = await httpClient.post<ApiFeedItem>(v1(`/groups/${groupId}/feed`), {
    content: text,
  });
  return fromApiFeedItem(data);
}
