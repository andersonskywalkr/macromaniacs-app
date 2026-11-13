import type { RankingEntry } from '@/api/types/domain';

// Ordenação ÚNICA do ranking de grupos: mais pontos primeiro; empate de pontos
// desempata pela maior sequência de dias; se ainda empatar, ordem alfabética
// do nome (só para a lista ficar estável).

export interface RankableMember {
  userId: string;
  displayName: string;
  username?: string;
  points: number;
  streak?: number;
}

export function compareMembers(a: RankableMember, b: RankableMember): number {
  if (b.points !== a.points) return b.points - a.points;
  const streakDiff = (b.streak ?? 0) - (a.streak ?? 0);
  if (streakDiff !== 0) return streakDiff;
  return a.displayName.localeCompare(b.displayName, 'pt-BR');
}

export function buildInitials(displayName?: string | null, username?: string | null): string {
  const source = displayName?.trim() || username?.trim() || '';
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const letters = words.length >= 2 ? `${words[0][0]}${words[1][0]}` : words[0].slice(0, 2);
  return letters.toUpperCase();
}

// Ordena e numera (1, 2, 3...). Posições são sequenciais: empate total fica
// na ordem alfabética.
export function rankMembers(members: RankableMember[]): RankingEntry[] {
  return [...members].sort(compareMembers).map((member, index) => ({
    position: index + 1,
    userId: member.userId,
    initials: buildInitials(member.displayName, member.username),
    displayName: member.displayName,
    points: member.points,
    streak: member.streak,
  }));
}

// Lista vinda do backend já traz a posição: só garante a ordem por posição.
export function sortByPosition(entries: RankingEntry[]): RankingEntry[] {
  return [...entries].sort((a, b) => a.position - b.position);
}

export function findEntry(entries: RankingEntry[], userId: string | undefined | null) {
  return userId ? entries.find((entry) => entry.userId === userId) : undefined;
}

export function splitPodium(entries: RankingEntry[]): {
  podium: RankingEntry[];
  others: RankingEntry[];
} {
  const sorted = sortByPosition(entries);
  return { podium: sorted.slice(0, 3), others: sorted.slice(3) };
}
