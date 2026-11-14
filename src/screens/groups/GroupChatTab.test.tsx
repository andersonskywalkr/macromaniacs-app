import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GroupChatTab } from './GroupChatTab';
import { getGroupFeedPage, sendGroupMessage } from '@/api/groups';

const mockGetFeed = jest.mocked(getGroupFeedPage);
const mockSend = jest.mocked(sendGroupMessage);

jest.mock('@/api/groups', () => ({
  getGroupFeedPage: jest.fn(),
  sendGroupMessage: jest.fn(),
  setGroupPostReaction: jest.fn(),
}));
jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { id: 'me', username: 'anderson', displayName: 'Anderson', timezone: 'America/Sao_Paulo' } }),
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
  return { SendIcon: () => ReactModule.createElement(MockView) };
});

const item = (id: string, userId: string, name: string, content: string | null, minutesAgo: number, mealLogId: string | null = null) => ({
  id,
  groupId: 'g1',
  userId,
  username: name.toLowerCase(),
  displayName: name,
  mealLogId,
  content,
  reactions: null,
  viewerReaction: null,
  createdAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
});

const feedPage = (items: ReturnType<typeof item>[]) => ({
  items,
  meta: { page: 1, limit: 50, totalItems: items.length, totalPages: 1 },
});

let queryClient: QueryClient;

function renderChat(live = true) {
  const tree = (isLive: boolean) => (
    <QueryClientProvider client={queryClient}>
      <GroupChatTab groupId="g1" live={isLive} />
    </QueryClientProvider>
  );
  const view = render(tree(live));
  return { ...view, setLive: (value: boolean) => view.rerender(tree(value)) };
}

describe('GroupChatTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('shows my messages and the others, in time order, under the "Hoje" separator', async () => {
    mockGetFeed.mockResolvedValue(feedPage([
      item('2', 'me', 'Anderson', 'Eu mesmo', 5),
      item('1', 'u2', 'Maria', 'Oi, pessoal', 30),
      item('3', 'u2', 'Maria', null, 2, 'meal-1'),
    ]));
    renderChat();

    expect(await screen.findByText('Oi, pessoal')).toBeTruthy();
    expect(screen.getByText('Eu mesmo')).toBeTruthy();
    expect(screen.getByText('Hoje')).toBeTruthy();
    // postagem com refeição e sem texto
    expect(screen.getByText('compartilhou uma refeição')).toBeTruthy();
    // nome do autor aparece só nas mensagens dos outros
    expect(screen.getAllByText('Maria')).toHaveLength(2);
    expect(screen.queryByText('Anderson')).toBeNull();
  });

  it('shows the friendly empty state', async () => {
    mockGetFeed.mockResolvedValue(feedPage([]));
    renderChat();

    expect(await screen.findByText('Nenhuma mensagem ainda.')).toBeTruthy();
    expect(screen.getByText('Seja o primeiro a enviar mensagem!')).toBeTruthy();
  });

  it('shows the error state with a retry', async () => {
    mockGetFeed.mockRejectedValueOnce(new Error('falhou'));
    renderChat();

    expect(await screen.findByText('Não foi possível carregar o chat')).toBeTruthy();
    mockGetFeed.mockResolvedValue(feedPage([]));
    fireEvent.press(screen.getByLabelText('Tentar de novo'));
    expect(await screen.findByText('Nenhuma mensagem ainda.')).toBeTruthy();
  });

  it('keeps the send button disabled with an empty field, and sends optimistically', async () => {
    mockGetFeed.mockResolvedValue(feedPage([]));
    let resolveSend: (value: ReturnType<typeof item>) => void = () => undefined;
    mockSend.mockReturnValue(new Promise((resolve) => (resolveSend = resolve)));
    renderChat();
    await screen.findByText('Nenhuma mensagem ainda.');

    expect(screen.getByLabelText('Enviar mensagem').props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(screen.getByLabelText('Mensagem'), '  Bora treinar!  ');
    expect(screen.getByLabelText('Enviar mensagem').props.accessibilityState.disabled).toBe(false);
    fireEvent.press(screen.getByLabelText('Enviar mensagem'));

    // aparece na hora, antes da resposta do servidor
    expect(screen.getByText('Bora treinar!')).toBeTruthy();
    expect(screen.getByText('Enviando…')).toBeTruthy();
    expect(mockSend).toHaveBeenCalledWith('g1', 'Bora treinar!');
    expect(screen.getByLabelText('Mensagem').props.value).toBe('');

    mockGetFeed.mockResolvedValue(
      feedPage([item('server-1', 'me', 'Anderson', 'Bora treinar!', 0)]),
    );
    await act(async () => {
      resolveSend(item('server-1', 'me', 'Anderson', 'Bora treinar!', 0));
    });
    expect(screen.queryByText('Enviando…')).toBeNull();
    // uma só cópia (a otimista foi trocada pela do servidor)
    expect(screen.getAllByText('Bora treinar!')).toHaveLength(1);
  });

  it('marks a failed message as "Não enviada" and retries', async () => {
    mockGetFeed.mockResolvedValue(feedPage([]));
    mockSend.mockRejectedValueOnce(new Error('sem rede'));
    renderChat();
    await screen.findByText('Nenhuma mensagem ainda.');

    fireEvent.changeText(screen.getByLabelText('Mensagem'), 'Oi');
    fireEvent.press(screen.getByLabelText('Enviar mensagem'));

    expect(await screen.findByText('Não enviada')).toBeTruthy();

    mockSend.mockResolvedValueOnce(item('server-2', 'me', 'Anderson', 'Oi', 0));
    mockGetFeed.mockResolvedValue(feedPage([item('server-2', 'me', 'Anderson', 'Oi', 0)]));
    fireEvent.press(screen.getByLabelText('Tentar de novo'));

    await act(async () => undefined);
    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Não enviada')).toBeNull();
    expect(screen.getAllByText('Oi')).toHaveLength(1);
  });

  it('limits the message to 2000 characters and warns near the limit', async () => {
    mockGetFeed.mockResolvedValue(feedPage([]));
    renderChat();
    await screen.findByText('Nenhuma mensagem ainda.');

    expect(screen.getByLabelText('Mensagem').props.maxLength).toBe(2000);

    fireEvent.changeText(screen.getByLabelText('Mensagem'), 'a'.repeat(1850));
    expect(screen.getByText('1850/2000 caracteres')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Mensagem'), 'a'.repeat(2000));
    expect(screen.getByText('Limite de 2000 caracteres atingido')).toBeTruthy();
  });
});

describe('GroupChatTab auto refresh', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
    });
    mockGetFeed.mockResolvedValue(feedPage([]));
  });

  afterEach(() => {
    queryClient.clear();
    jest.useRealTimers();
  });

  it('refreshes every 15 seconds while live, and stops when the screen loses focus', async () => {
    const { setLive } = renderChat(true);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(mockGetFeed).toHaveBeenCalledTimes(1);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(15_000);
    });
    expect(mockGetFeed).toHaveBeenCalledTimes(2);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(15_000);
    });
    expect(mockGetFeed).toHaveBeenCalledTimes(3);

    // saiu da tela (ou trocou de aba): para de atualizar
    setLive(false);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(60_000);
    });
    expect(mockGetFeed).toHaveBeenCalledTimes(3);
  });
});

describe('GroupChatTab message field (WhatsApp style)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
    });
    mockGetFeed.mockResolvedValue(feedPage([]));
  });

  afterEach(() => {
    queryClient.clear();
  });

  const grow = (screen: typeof import('@testing-library/react-native').screen, contentHeight: number) =>
    fireEvent(screen.getByLabelText('Mensagem'), 'contentSizeChange', {
      nativeEvent: { contentSize: { width: 200, height: contentHeight } },
    });

  const heightOf = (screen: typeof import('@testing-library/react-native').screen) => {
    const style = screen.getByLabelText('Mensagem').props.style;
    return (Array.isArray(style) ? Object.assign({}, ...style.flat(5)) : style).height;
  };

  it('starts with one line, multiline, and not scrollable', async () => {
    renderChat();
    await screen.findByText('Nenhuma mensagem ainda.');

    const field = screen.getByLabelText('Mensagem');
    expect(field.props.multiline).toBe(true);
    expect(field.props.scrollEnabled).toBe(false);
    expect(heightOf(screen)).toBe(20);
  });

  it('grows with the text up to about 5 lines', async () => {
    renderChat();
    await screen.findByText('Nenhuma mensagem ainda.');

    grow(screen, 40);
    expect(heightOf(screen)).toBe(40);
    expect(screen.getByLabelText('Mensagem').props.scrollEnabled).toBe(false);

    grow(screen, 100);
    expect(heightOf(screen)).toBe(100);
    expect(screen.getByLabelText('Mensagem').props.scrollEnabled).toBe(false);
  });

  it('stops growing at the limit and scrolls inside (8 lines)', async () => {
    renderChat();
    await screen.findByText('Nenhuma mensagem ainda.');

    grow(screen, 160); // 8 linhas

    expect(heightOf(screen)).toBe(100);
    expect(screen.getByLabelText('Mensagem').props.scrollEnabled).toBe(true);
  });

  it('goes back to one line after sending', async () => {
    mockSend.mockResolvedValue(item('server-9', 'me', 'Anderson', 'Texto grande', 0));
    renderChat();
    await screen.findByText('Nenhuma mensagem ainda.');

    fireEvent.changeText(screen.getByLabelText('Mensagem'), 'Texto grande');
    grow(screen, 160);
    expect(heightOf(screen)).toBe(100);

    fireEvent.press(screen.getByLabelText('Enviar mensagem'));
    await act(async () => undefined);

    expect(heightOf(screen)).toBe(20);
    expect(screen.getByLabelText('Mensagem').props.scrollEnabled).toBe(false);
  });
});
