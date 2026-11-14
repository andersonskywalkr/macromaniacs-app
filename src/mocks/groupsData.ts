import type { GroupFeedItem, GroupReaction, GroupSummary, RankingEntry } from '@/api/types/domain';
import { rankMembers, type RankableMember } from '@/utils/ranking';
import { mockGamificationStats, mockUserProfile } from './data';

// FONTE ÚNICA dos grupos no modo mock: a lista de grupos, o ranking (Home,
// lista, pódio e ranking completo), a contagem de membros, as mensagens do
// chat e a entrada por código de convite saem daqui. Em memória: some ao
// reiniciar o app.

export const MOCK_USER_ID = mockUserProfile.id;
const MOCK_USERNAME = mockUserProfile.username;
const MOCK_DISPLAY_NAME = mockUserProfile.displayName ?? 'Anderson';

// O usuário atual aparece em todos os grupos com os pontos e a sequência do
// perfil (a mesma gamificação do Perfil e da Home).
const me: RankableMember = {
  userId: MOCK_USER_ID,
  username: MOCK_USERNAME,
  displayName: MOCK_DISPLAY_NAME,
  points: mockGamificationStats.points,
  streak: mockGamificationStats.currentStreak,
};

interface MockGroupDefinition {
  group: Omit<GroupSummary, 'memberCount'>;
  members: RankableMember[];
}

const member = (
  userId: string,
  displayName: string,
  username: string,
  points: number,
  streak: number,
): RankableMember => ({ userId, displayName, username, points, streak });

const joinedDefinitions: MockGroupDefinition[] = [
  {
    group: {
      id: 'group-1',
      name: 'Los Maniacs',
      description: 'Onde os fracos não têm vez.',
      isPrivate: true,
      role: 'MEMBER',
      inviteCode: 'LOSMAN26',
    },
    members: [
      member('user-2', 'Maria Pereira', 'maria_p', 980, 12),
      me,
      member('user-3', 'João Silva', 'joao_s', 310, 4),
      member('user-4', 'Carla Souza', 'carla_s', 290, 3),
      member('user-5', 'Pedro Almeida', 'pedro_a', 240, 2),
      member('user-6', 'Bianca Rocha', 'bianca_r', 180, 1),
      member('user-7', 'Rafael Costa', 'rafael_c', 90, 0),
    ],
  },
  {
    group: {
      id: 'group-2',
      name: 'Time da Academia',
      description: 'Treino e dieta em dia, todo mundo junto.',
      isPrivate: true,
      role: 'MEMBER',
      inviteCode: 'TIMEAC01',
    },
    members: [
      member('user-8', 'Gustavo Alves', 'gustavo_a', 510, 7),
      // empata em pontos com "Você": quem tem a maior sequência fica na frente
      member('user-9', 'Fernanda Lima', 'fernanda_l', 420, 9),
      me,
      member('user-10', 'Paulo Mendes', 'paulo_m', 300, 3),
      member('user-11', 'Larissa Dias', 'larissa_d', 260, 2),
    ],
  },
  {
    group: {
      id: 'group-3',
      name: 'Família Fit',
      description: 'Cuidando da saúde em família.',
      isPrivate: true,
      role: 'OWNER',
      inviteCode: 'FAMILIA3',
    },
    members: [
      member('user-12', 'Helena Lacerda', 'helena_l', 600, 10),
      me,
      member('user-13', 'Marcos Lacerda', 'marcos_l', 350, 5),
      member('user-14', 'Juliana Lacerda', 'juliana_l', 120, 1),
    ],
  },
];

// Grupo que o usuário ainda NÃO participa: serve para testar "Entrar em um
// grupo". Código de exemplo: CORRIDA7.
export const MOCK_EXAMPLE_JOIN_CODE = 'CORRIDA7';

const joinableDefinition: MockGroupDefinition = {
  group: {
    id: 'group-4',
    name: 'Corrida de Domingo',
    description: 'Corrida leve e café da manhã depois.',
    isPrivate: false,
    role: 'MEMBER',
    inviteCode: MOCK_EXAMPLE_JOIN_CODE,
  },
  members: [
    member('user-15', 'Camila Torres', 'camila_t', 450, 6),
    member('user-16', 'Diego Martins', 'diego_m', 380, 4),
    member('user-17', 'Aline Barros', 'aline_b', 200, 2),
    member('user-18', 'Bruno Teixeira', 'bruno_t', 140, 1),
  ],
};

let joinedGroupIds: string[] = joinedDefinitions.map((d) => d.group.id);
let allDefinitions = [...joinedDefinitions, joinableDefinition];
// Quem entrou depois do estado inicial (por id do grupo)
let membersByGroup: Record<string, RankableMember[]> = Object.fromEntries(
  allDefinitions.map((d) => [d.group.id, d.members]),
);

function definitionOf(groupId: string): MockGroupDefinition | undefined {
  return allDefinitions.find((d) => d.group.id === groupId);
}

export function getMockGroups(): GroupSummary[] {
  return joinedGroupIds.flatMap((id) => {
    const definition = definitionOf(id);
    if (!definition) return [];
    return [{ ...definition.group, memberCount: membersByGroup[id].length }];
  });
}

export function getMockGroupRanking(groupId: string): RankingEntry[] {
  return rankMembers(membersByGroup[groupId] ?? []);
}

export type MockJoinResult =
  | { status: 'joined'; group: GroupSummary }
  | { status: 'already-member'; group: GroupSummary }
  | { status: 'invalid' };

export function joinMockGroup(inviteCode: string): MockJoinResult {
  const code = inviteCode.trim().toUpperCase();
  const definition = allDefinitions.find((d) => d.group.inviteCode === code);
  if (!definition) return { status: 'invalid' };

  const id = definition.group.id;
  if (joinedGroupIds.includes(id)) {
    return {
      status: 'already-member',
      group: { ...definition.group, memberCount: membersByGroup[id].length },
    };
  }

  joinedGroupIds = [...joinedGroupIds, id];
  membersByGroup = { ...membersByGroup, [id]: [...membersByGroup[id], me] };
  return {
    status: 'joined',
    group: { ...definition.group, memberCount: membersByGroup[id].length },
  };
}

export function createMockGroup(input: {
  name: string;
  description?: string | null;
  isPrivate?: boolean;
}): GroupSummary {
  const id = `group-${Date.now()}`;
  const inviteCode = Math.random().toString(36).slice(2, 10).toUpperCase().padEnd(8, '0');
  const definition: MockGroupDefinition = {
    group: {
      id,
      name: input.name,
      description: input.description ?? null,
      isPrivate: input.isPrivate ?? true,
      role: 'ADMIN',
      inviteCode,
    },
    members: [me],
  };
  allDefinitions = [...allDefinitions, definition];
  joinedGroupIds = [...joinedGroupIds, id];
  membersByGroup = { ...membersByGroup, [id]: [me] };
  feedByGroup = { ...feedByGroup, [id]: [] };
  return { ...definition.group, memberCount: 1 };
}

export function leaveMockGroup(groupId: string): boolean {
  const definition = definitionOf(groupId);
  if (!definition || !joinedGroupIds.includes(groupId)) return false;
  if (definition.group.role?.toUpperCase() === 'ADMIN') return false;
  joinedGroupIds = joinedGroupIds.filter((id) => id !== groupId);
  membersByGroup = {
    ...membersByGroup,
    [groupId]: (membersByGroup[groupId] ?? []).filter((entry) => entry.userId !== MOCK_USER_ID),
  };
  return true;
}

// --- Chat (feed) ---

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

function messagesFor(
  groupId: string,
  seed: { userId: string; offsetMs: number; content: string | null; mealLogId?: string }[],
): GroupFeedItem[] {
  const now = Date.now();
  return seed.map((entry, index) => {
    const author = (membersByGroup[groupId] ?? []).find((m) => m.userId === entry.userId);
    return {
      id: `${groupId}-msg-${index + 1}`,
      groupId,
      userId: entry.userId,
      username: author?.username ?? 'membro',
      displayName: author?.displayName ?? 'Membro',
      mealLogId: entry.mealLogId ?? null,
      content: entry.content,
      reactions: null,
      viewerReaction: null,
      createdAt: new Date(now - entry.offsetMs).toISOString(),
    };
  });
}

let feedByGroup: Record<string, GroupFeedItem[]> = {
  'group-1': messagesFor('group-1', [
    { userId: 'user-2', offsetMs: 27 * HOUR, content: 'Bom dia, galera! Quem vai treinar hoje?' },
    { userId: 'user-3', offsetMs: 26 * HOUR, content: 'Eu vou de perna. Só depois do almoço.' },
    { userId: 'user-2', offsetMs: 40 * MINUTE, content: 'Bati a meta de proteína hoje!' },
    { userId: 'user-2', offsetMs: 38 * MINUTE, content: null, mealLogId: 'meal-shared-1' },
    { userId: 'user-4', offsetMs: 12 * MINUTE, content: 'Parabéns, Maria! Ainda falta o meu jantar.' },
  ]),
  'group-2': messagesFor('group-2', [
    { userId: 'user-8', offsetMs: 30 * HOUR, content: 'Semana de treino pesado, bora!' },
    { userId: 'user-9', offsetMs: 25 * MINUTE, content: 'Alguém topa um treino de manhã cedo amanhã?' },
  ]),
  'group-3': messagesFor('group-3', [
    { userId: 'user-12', offsetMs: 3 * HOUR, content: 'Fiz uma salada bem colorida no almoço.' },
    { userId: 'user-13', offsetMs: 2 * HOUR, content: 'Quero a receita!' },
  ]),
  'group-4': messagesFor('group-4', [
    { userId: 'user-15', offsetMs: 5 * HOUR, content: 'Domingo que vem a corrida é no parque.' },
  ]),
};

export function getMockFeed(groupId: string): GroupFeedItem[] {
  return [...(feedByGroup[groupId] ?? [])];
}

export function addMockMessage(groupId: string, content: string): GroupFeedItem {
  const item: GroupFeedItem = {
    id: `${groupId}-msg-${Date.now()}`,
    groupId,
    userId: MOCK_USER_ID,
    username: MOCK_USERNAME,
    displayName: MOCK_DISPLAY_NAME,
    mealLogId: null,
    content,
    reactions: null,
    viewerReaction: null,
    createdAt: new Date().toISOString(),
  };
  feedByGroup = { ...feedByGroup, [groupId]: [...(feedByGroup[groupId] ?? []), item] };
  return item;
}

export function reactToMockPost(
  groupId: string,
  postId: string,
  reactionType: GroupReaction | null,
): GroupFeedItem | null {
  let changed: GroupFeedItem | null = null;
  feedByGroup = {
    ...feedByGroup,
    [groupId]: (feedByGroup[groupId] ?? []).map((item) => {
      if (item.id !== postId) return item;
      const reactions = { ...(item.reactions ?? {}) };
      if (item.viewerReaction) {
        reactions[item.viewerReaction] = Math.max(0, (reactions[item.viewerReaction] ?? 1) - 1);
      }
      if (reactionType) reactions[reactionType] = (reactions[reactionType] ?? 0) + 1;
      changed = { ...item, reactions, viewerReaction: reactionType };
      return changed;
    }),
  };
  return changed;
}

export function resetMockGroups(): void {
  joinedGroupIds = joinedDefinitions.map((d) => d.group.id);
  membersByGroup = Object.fromEntries(allDefinitions.map((d) => [d.group.id, d.members]));
  feedByGroup = Object.fromEntries(
    Object.entries(feedByGroup).map(([id, items]) => [
      id,
      items.filter((item) => item.userId !== MOCK_USER_ID),
    ]),
  );
}
