import React from 'react';
import { Share } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { GroupsListScreen } from './GroupsListScreen';
import { GroupProfileScreen } from './GroupProfileScreen';
import { RankingFullScreen } from './RankingFullScreen';
import { GroupAboutTab, buildInviteMessage, roleLabel } from './GroupAboutTab';
import { ApiError } from '@/api/ApiError';
import { rankMembers } from '@/utils/ranking';

const ranking = rankMembers([
  { userId: 'u2', displayName: 'Maria Pereira', points: 980, streak: 12 },
  { userId: 'me', displayName: 'Anderson', points: 420, streak: 5 },
  { userId: 'u3', displayName: 'João Silva', points: 310, streak: 4 },
  { userId: 'u4', displayName: 'Carla Souza', points: 290, streak: 3 },
]);

const group = {
  id: 'g1',
  name: 'Los Maniacs',
  inviteCode: 'LOSMAN26',
  description: 'Onde os fracos não têm vez.',
  role: 'MEMBER',
};

type QueryState = { data?: unknown; isLoading: boolean; isError: boolean };
let mockGroups: QueryState;
let mockRanking: QueryState;
const mockRefetchGroups = jest.fn();
const mockRefetchRanking = jest.fn();
const mockMutateAsync = jest.fn();
let mockJoinPending = false;

jest.mock('@/queries/useMyGroups', () => ({
  useMyGroups: () => ({ ...mockGroups, refetch: mockRefetchGroups }),
}));
jest.mock('@/queries/useGroupRanking', () => ({
  useGroupRanking: () => ({ ...mockRanking, refetch: mockRefetchRanking }),
}));
jest.mock('@/queries/useJoinGroup', () => ({
  useJoinGroup: () => ({ mutateAsync: mockMutateAsync, isPending: mockJoinPending }),
}));
jest.mock('@/screens/groups/GroupChatTab', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    GroupChatTab: ({ live }: { live: boolean }) =>
      ReactModule.createElement(MockText, null, `CHAT live=${live}`),
  };
});
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }));
jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: { id: 'me' } }),
}));
jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    tokens: {
      background: '#000',
      card: '#111',
      text: '#fff',
      textSecondary: '#aaa',
      primary: '#bba0ff',
      onPrimary: '#fff',
      danger: '#f88',
      track: '#222',
      shadow: '#000',
      gold: '#edb25c',
    },
  }),
}));
jest.mock('@/components/Avatar', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Avatar: () => ReactModule.createElement(MockView) };
});
jest.mock('@/components/icons', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } = jest.requireActual<typeof import('react-native')>('react-native');
  const MockIcon = () => ReactModule.createElement(MockView);
  return {
    MedalIcon: MockIcon,
    ChevronRightIcon: MockIcon,
    EyeIcon: MockIcon,
    EyeOffIcon: MockIcon,
    SendIcon: MockIcon,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockJoinPending = false;
  mockGroups = { data: [group], isLoading: false, isError: false };
  mockRanking = { data: ranking, isLoading: false, isError: false };
});

describe('GroupsListScreen', () => {
  function renderList() {
    const navigation = { navigate: jest.fn() };
    const screen = render(<GroupsListScreen navigation={navigation as never} route={{} as never} />);
    return { navigation, screen };
  }

  it('shows a card per group with members, my position, the top 3 and the invite code', () => {
    const { navigation, screen } = renderList();

    expect(screen.getByLabelText('Los Maniacs, 4 membros, sua posição 2')).toBeTruthy();
    expect(screen.getByText('Maria Pereira')).toBeTruthy();
    expect(screen.getByText('Você')).toBeTruthy();
    expect(screen.getByText('João Silva')).toBeTruthy();
    expect(screen.queryByText('Carla Souza')).toBeNull(); // só o top 3
    expect(screen.getByText('LOSMAN26')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Los Maniacs, 4 membros, sua posição 2'));
    expect(navigation.navigate).toHaveBeenCalledWith('GroupProfile', { groupId: 'g1' });
  });

  it('shows the friendly empty state', () => {
    mockGroups = { data: [], isLoading: false, isError: false };
    const { screen } = renderList();
    expect(screen.getByText('Você ainda não está em nenhum grupo')).toBeTruthy();
  });

  it('shows loading and the error state with a retry', () => {
    mockGroups = { data: undefined, isLoading: true, isError: false };
    const loading = renderList();
    expect(loading.screen.getByLabelText('Carregando grupos')).toBeTruthy();
    loading.screen.unmount();

    mockGroups = { data: undefined, isLoading: false, isError: true };
    const failed = renderList();
    fireEvent.press(failed.screen.getByLabelText('Tentar de novo'));
    expect(mockRefetchGroups).toHaveBeenCalled();
  });

  it('joins a group with a valid code', async () => {
    mockMutateAsync.mockResolvedValue({ id: 'g4', name: 'Corrida de Domingo' });
    const { screen } = renderList();

    fireEvent.press(screen.getByLabelText('Entrar em um grupo'));
    fireEvent.changeText(screen.getByLabelText('Código de convite'), 'corrida7');
    expect(screen.getByLabelText('Código de convite').props.value).toBe('CORRIDA7');
    fireEvent.press(screen.getByLabelText('Entrar'));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith('CORRIDA7'));
    expect(await screen.findByText('Você entrou em “Corrida de Domingo”.')).toBeTruthy();
  });

  it('validates the code format before calling the API', () => {
    const { screen } = renderList();

    fireEvent.press(screen.getByLabelText('Entrar em um grupo'));
    fireEvent.changeText(screen.getByLabelText('Código de convite'), 'ABC');
    fireEvent.press(screen.getByLabelText('Entrar'));

    expect(screen.getByText(/8 caracteres/)).toBeTruthy();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('shows a clear message for an invalid code', async () => {
    mockMutateAsync.mockRejectedValue(
      new ApiError({ statusCode: 404, message: 'Código inválido', timestamp: '', path: '' }),
    );
    const { screen } = renderList();

    fireEvent.press(screen.getByLabelText('Entrar em um grupo'));
    fireEvent.changeText(screen.getByLabelText('Código de convite'), 'ZZZZZZZZ');
    fireEvent.press(screen.getByLabelText('Entrar'));

    expect(await screen.findByText('Código inválido. Confira com quem te convidou.')).toBeTruthy();
  });
});

describe('GroupProfileScreen', () => {
  function renderProfile(params: { groupId: string; origin?: 'home' } = { groupId: 'g1' }) {
    const parent = { navigate: jest.fn() };
    const navigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
      canGoBack: jest.fn(() => true),
      reset: jest.fn(),
      getParent: jest.fn(() => parent),
    };
    const screen = render(
      <GroupProfileScreen navigation={navigation as never} route={{ params } as never} />,
    );
    return { navigation, parent, screen };
  }

  it('shows the group header and the four tabs, starting on Ranking with the podium', () => {
    const { navigation, screen } = renderProfile();

    expect(screen.getByText('Los Maniacs')).toBeTruthy();
    expect(screen.getByText('4 membros')).toBeTruthy();
    for (const tab of ['Ranking', 'Chat', 'Metas', 'Sobre']) {
      expect(screen.getByLabelText(tab)).toBeTruthy();
    }
    expect(screen.getByLabelText('Ranking').props.accessibilityState.selected).toBe(true);

    // pódio: top 3 com "Você" em destaque, e o 4º na lista
    expect(screen.getByLabelText('1º lugar, Maria Pereira, 980 pontos')).toBeTruthy();
    expect(screen.getByLabelText('2º lugar, Você, 420 pontos')).toBeTruthy();
    expect(screen.getByLabelText('3º lugar, João Silva, 310 pontos')).toBeTruthy();
    expect(screen.getByLabelText('4º lugar, Carla Souza, 290 pontos')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Ver ranking completo'));
    expect(navigation.navigate).toHaveBeenCalledWith('RankingFull', { groupId: 'g1' });
  });

  it('switches tabs: Chat turns the live refresh on, Metas is empty, Sobre shows the group', () => {
    const { screen } = renderProfile();

    fireEvent.press(screen.getByLabelText('Chat'));
    expect(screen.getByText('CHAT live=true')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Metas'));
    expect(screen.queryByText(/CHAT/)).toBeNull();
    expect(screen.getByText('Metas do grupo chegam em breve')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Sobre'));
    // descrição no cabeçalho e na aba Sobre
    expect(screen.getAllByText('Onde os fracos não têm vez.')).toHaveLength(2);
    expect(screen.getByText('LOSMAN26')).toBeTruthy();
    expect(screen.getByText('Membro')).toBeTruthy();
  });

  it('goes back normally', () => {
    const { navigation, screen } = renderProfile();
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('coming from the Home, back leaves the group list underneath and returns to the Home', () => {
    const { navigation, parent, screen } = renderProfile({ groupId: 'g1', origin: 'home' });

    fireEvent.press(screen.getByLabelText('Voltar'));

    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'GroupsList' }] });
    expect(parent.navigate).toHaveBeenCalledWith('HomeTab');
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('shows "grupo não encontrado" and the error state', () => {
    mockGroups = { data: [], isLoading: false, isError: false };
    const missing = renderProfile();
    expect(missing.screen.getByText('Grupo não encontrado')).toBeTruthy();
    missing.screen.unmount();

    mockGroups = { data: undefined, isLoading: false, isError: true };
    const failed = renderProfile();
    fireEvent.press(failed.screen.getByLabelText('Tentar de novo'));
    expect(mockRefetchGroups).toHaveBeenCalled();
  });
});

describe('RankingFullScreen', () => {
  function renderFull() {
    const navigation = { goBack: jest.fn() };
    const screen = render(
      <RankingFullScreen navigation={navigation as never} route={{ params: { groupId: 'g1' } } as never} />,
    );
    return { navigation, screen };
  }

  it('lists every member with position and points, highlights "Você" and shows the streak when it exists', () => {
    const { screen } = renderFull();

    expect(screen.getByText('Ranking completo')).toBeTruthy();
    expect(screen.getByText('Los Maniacs')).toBeTruthy();
    expect(screen.getByLabelText('1º lugar, Maria Pereira, 980 pontos, 12 dias seguidos')).toBeTruthy();
    expect(screen.getByLabelText('2º lugar, Você, 420 pontos, 5 dias seguidos')).toBeTruthy();
    expect(screen.getByLabelText('4º lugar, Carla Souza, 290 pontos, 3 dias seguidos')).toBeTruthy();
  });

  it('does not show the streak when the data does not have it (real backend)', () => {
    mockRanking = {
      data: ranking.map((entry) => ({ ...entry, streak: undefined })),
      isLoading: false,
      isError: false,
    };
    const { screen } = renderFull();

    expect(screen.getByLabelText('1º lugar, Maria Pereira, 980 pontos')).toBeTruthy();
    expect(screen.queryByText(/dias seguidos/)).toBeNull();
  });

  it('shows the error state with a retry', () => {
    mockRanking = { data: undefined, isLoading: false, isError: true };
    const { screen } = renderFull();

    fireEvent.press(screen.getByLabelText('Tentar de novo'));
    expect(mockRefetchRanking).toHaveBeenCalled();
  });
});

describe('GroupAboutTab', () => {
  it('shares the invite code with the native share sheet', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    const screen = render(
      <GroupAboutTab group={group} entries={ranking} memberCount={4} currentUserId="me" />,
    );

    fireEvent.press(screen.getByLabelText('Compartilhar'));

    await waitFor(() => expect(share).toHaveBeenCalledWith({ message: buildInviteMessage(group) }));
    expect(buildInviteMessage(group)).toContain('LOSMAN26');
    share.mockRestore();
  });

  it('lists the members with position and points', () => {
    const screen = render(
      <GroupAboutTab group={group} entries={ranking} memberCount={4} currentUserId="me" />,
    );
    expect(screen.getByLabelText('3º lugar, João Silva, 310 pontos')).toBeTruthy();
  });

  it('translates the role', () => {
    expect(roleLabel('OWNER')).toBe('Dono');
    expect(roleLabel('admin')).toBe('Administrador');
    expect(roleLabel('MEMBER')).toBe('Membro');
    expect(roleLabel('OUTRO')).toBe('OUTRO');
    expect(roleLabel(undefined)).toBe('—');
  });
});
