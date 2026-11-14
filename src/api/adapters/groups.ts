import type {
  GroupFeedItem,
  GroupReaction,
  GroupSummary,
  RankingEntry,
} from '../types/domain';
import { buildInitials } from '@/utils/ranking';
import { toNumber } from './common';

// GET /v1/groups: lista simples; não tem memberCount.
export interface ApiGroup {
  id: string;
  name: string;
  description?: string | null;
  isPrivate?: boolean;
  role?: string;
  inviteCode: string;
  createdAt?: string;
}

// GET /v1/groups/:id/ranking: não tem iniciais nem sequência.
export interface ApiRankingEntry {
  position: number | string;
  userId: string;
  username: string;
  displayName?: string | null;
  points: number | string;
}

// GET /v1/groups/:id/feed
export interface ApiFeedItem {
  id: string;
  groupId: string;
  userId: string;
  username: string;
  displayName?: string | null;
  mealLogId?: string | null;
  content?: string | null;
  reactions?: unknown;
  viewerReaction?: string | null;
  createdAt: string;
}

export function fromApiGroup(group: ApiGroup): GroupSummary {
  // memberCount não existe no backend: o campo fica de fora, sem inventar valor.
  return {
    id: group.id,
    name: group.name,
    inviteCode: group.inviteCode,
    description: group.description ?? null,
    isPrivate: group.isPrivate,
    role: group.role,
  };
}

// Iniciais: implementação única em utils/ranking.ts (também usada pelo mock).
export { buildInitials } from '@/utils/ranking';

export function fromApiRankingEntry(entry: ApiRankingEntry): RankingEntry {
  return {
    position: toNumber(entry.position),
    userId: entry.userId,
    initials: buildInitials(entry.displayName, entry.username),
    displayName: entry.displayName?.trim() || entry.username,
    points: toNumber(entry.points),
  };
}

export function fromApiFeedItem(item: ApiFeedItem): GroupFeedItem {
  const reaction = item.viewerReaction;
  return {
    id: item.id,
    groupId: item.groupId,
    userId: item.userId,
    username: item.username,
    displayName: item.displayName?.trim() || item.username,
    mealLogId: item.mealLogId ?? null,
    content: item.content ?? null,
    reactions:
      item.reactions && typeof item.reactions === 'object'
        ? (item.reactions as Partial<Record<GroupReaction, number>>)
        : null,
    viewerReaction:
      reaction === 'FIRE' || reaction === 'CLAP' || reaction === 'STRONG'
        ? reaction
        : null,
    createdAt: item.createdAt,
  };
}
