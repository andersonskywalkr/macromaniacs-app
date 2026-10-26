import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';

const mockUser = {
  id: 'user-id',
  username: 'nicolly',
  displayName: 'Nicolly',
  nutrition: {
    bmrKcalPerDay: 1780,
    tdeeKcalPerDay: 2759,
    calorieTargetKcalPerDay: 2500,
  },
};

const mockRefetchProgress = jest.fn();
const mockRefetchGamification = jest.fn();

type QueryState = { data?: unknown; isLoading: boolean; isError: boolean };
let mockProgress: QueryState;
let mockGamification: QueryState;

const progressOf = (consumed: {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}) => ({
  calories: { goal: 2500, consumed: consumed.calories },
  protein: { goal: 160, consumed: consumed.protein },
  carbohydrates: { goal: 280, consumed: consumed.carbohydrates },
  fat: { goal: 80, consumed: consumed.fat },
});

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: { user: typeof mockUser }) => unknown) =>
    selector({ user: mockUser }),
}));
jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    tokens: {
      background: '#000',
      card: '#111',
      text: '#fff',
      textSecondary: '#aaa',
      primary: '#bba0ff',
      ring: '#8b5cf6',
      track: '#222',
      gold: '#edb25c',
      danger: '#f88',
      protein: '#f00',
      carbs: '#fa0',
      fat: '#0f0',
    },
    mode: 'dark',
    setMode: jest.fn(),
  }),
}));
jest.mock('@/queries/useGamificationStats', () => ({
  useGamificationStats: () => ({ ...mockGamification, refetch: mockRefetchGamification }),
}));
jest.mock('@/queries/useProgressToday', () => ({
  useProgressToday: () => ({ ...mockProgress, refetch: mockRefetchProgress }),
}));
jest.mock('@/queries/useMyGroups', () => ({
  useMyGroups: () => ({ data: [] }),
}));
jest.mock('@/queries/useGroupRanking', () => ({
  useGroupRanking: () => ({ data: [], isLoading: false }),
}));
jest.mock('@/components/Avatar', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return { Avatar: () => ReactModule.createElement(MockView) };
});
jest.mock('@/components/ProgressRing', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    ProgressRing: (props: { progress: number }) =>
      ReactModule.createElement(MockView, { testID: 'ring', accessibilityValue: { now: props.progress } }),
  };
});
jest.mock('@/components/icons', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } =
    jest.requireActual<typeof import('react-native')>('react-native');
  const MockIcon = () => ReactModule.createElement(MockView);
  return {
    BellIcon: MockIcon,
    PlusIcon: MockIcon,
    ChevronRightIcon: MockIcon,
    TrendingUpIcon: MockIcon,
    FireIcon: MockIcon,
    MedalIcon: MockIcon,
  };
});

function renderHome() {
  const navigation = { navigate: jest.fn() };
  const screen = render(<HomeScreen navigation={navigation as never} route={{} as never} />);
  return { navigation, screen };
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGamification = { data: { currentStreak: 5 }, isLoading: false, isError: false };
    mockProgress = {
      data: progressOf({ calories: 0, protein: 0, carbohydrates: 0, fat: 0 }),
      isLoading: false,
      isError: false,
    };
  });

  it('starts the day with everything remaining, and no TMB/TDEE or placeholder notice', () => {
    const { screen } = renderHome();

    expect(screen.getByText('Olá, Nicolly')).toBeTruthy();
    // restantes (anel) e meta (direita) = 2500; consumidas (esquerda) = 0
    expect(screen.getAllByText('2500')).toHaveLength(2);
    expect(screen.getByText('kcal restantes')).toBeTruthy();
    expect(screen.getByText('consumidas')).toBeTruthy();
    expect(screen.getByText('meta')).toBeTruthy();
    expect(screen.getByTestId('ring').props.accessibilityValue.now).toBe(0);

    expect(screen.queryByText('TMB')).toBeNull();
    expect(screen.queryByText('TDEE')).toBeNull();
    expect(screen.queryByText('1780')).toBeNull();
    expect(screen.queryByText('2759')).toBeNull();
    expect(screen.queryByText(/aparecerão quando o diário/)).toBeNull();
  });

  it('shows consumed, remaining, ring and macro bars after eating', () => {
    mockProgress = {
      data: progressOf({ calories: 500, protein: 80, carbohydrates: 70, fat: 20 }),
      isLoading: false,
      isError: false,
    };
    const { screen } = renderHome();

    expect(screen.getByText('500')).toBeTruthy();
    expect(screen.getByText('2000')).toBeTruthy();
    expect(screen.getByTestId('ring').props.accessibilityValue.now).toBeCloseTo(0.2);
    expect(screen.getByLabelText('Carboidratos: 70 de 280 gramas')).toBeTruthy();
    expect(screen.getByLabelText('Proteínas: 80 de 160 gramas')).toBeTruthy();
    expect(screen.getByLabelText('Gorduras: 20 de 80 gramas')).toBeTruthy();
    expect(screen.queryByText(/acima da meta/)).toBeNull();
  });

  it('shows the excess in text and caps the ring at 100% when over the goal', () => {
    mockProgress = {
      data: progressOf({ calories: 2620, protein: 200, carbohydrates: 300, fat: 90 }),
      isLoading: false,
      isError: false,
    };
    const { screen } = renderHome();

    expect(screen.getByText('120 kcal acima da meta')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByTestId('ring').props.accessibilityValue.now).toBe(1);
    expect(screen.getByLabelText('Proteínas: 200 de 160 gramas')).toBeTruthy();
  });

  it('falls back to the default macro split when the progress has no macro goals', () => {
    mockProgress = {
      data: {
        calories: { goal: 2500, consumed: 0 },
        protein: { goal: 0, consumed: 0 },
        carbohydrates: { goal: 0, consumed: 0 },
        fat: { goal: 0, consumed: 0 },
      },
      isLoading: false,
      isError: false,
    };
    const { screen } = renderHome();

    // 2500 kcal: 50% carbo = 312,5 g -> 313 | 25% prot = 156 g | 25% gord = 69 g
    expect(screen.getByLabelText('Carboidratos: 0 de 313 gramas')).toBeTruthy();
    expect(screen.getByLabelText('Proteínas: 0 de 156 gramas')).toBeTruthy();
    expect(screen.getByLabelText('Gorduras: 0 de 69 gramas')).toBeTruthy();
  });

  it('keeps the rest of the screen when the streak query fails, with a retry only there', () => {
    mockGamification = { data: undefined, isLoading: false, isError: true };
    const { screen } = renderHome();

    expect(screen.getByText('Olá, Nicolly')).toBeTruthy();
    expect(screen.getAllByText('2500')).toHaveLength(2);
    expect(screen.getByLabelText('Carboidratos: 0 de 280 gramas')).toBeTruthy();
    expect(screen.queryByText('Não foi possível carregar a Home')).toBeNull();

    expect(screen.getByText('Não foi possível carregar sua sequência.')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Tentar de novo'));
    expect(mockRefetchGamification).toHaveBeenCalledTimes(1);
    expect(mockRefetchProgress).not.toHaveBeenCalled();
  });

  it('shows a retry only in the calories card when the progress query fails', () => {
    mockProgress = { data: undefined, isLoading: false, isError: true };
    const { screen } = renderHome();

    expect(screen.getByText('Olá, Nicolly')).toBeTruthy();
    expect(screen.getByLabelText('Sequência de 5 dias')).toBeTruthy();
    expect(screen.getByText('Não foi possível carregar seu consumo de hoje.')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Tentar de novo'));
    expect(mockRefetchProgress).toHaveBeenCalledTimes(1);
  });

  it('has no theme toggle in the header', () => {
    const { screen } = renderHome();

    expect(screen.queryByLabelText('Alternar tema claro e escuro')).toBeNull();
    expect(screen.getByLabelText('Notificações')).toBeTruthy();
  });

  it('opens the food search from the "Adicionar refeição" button', () => {
    const { navigation, screen } = renderHome();

    fireEvent.press(screen.getByLabelText('Adicionar refeição'));

    expect(navigation.navigate).toHaveBeenCalledWith('MealsTab', { screen: 'FoodSearch' });
  });
});
