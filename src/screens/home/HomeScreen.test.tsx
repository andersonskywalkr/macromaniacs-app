import React from 'react';
import { render } from '@testing-library/react-native';
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
    },
    mode: 'dark',
    setMode: jest.fn(),
  }),
}));
jest.mock('@/queries/useGamificationStats', () => ({
  useGamificationStats: () => ({
    data: { currentStreak: 5 },
    isLoading: false,
    isError: false,
  }),
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
  return { ProgressRing: () => ReactModule.createElement(MockView) };
});
jest.mock('@/components/icons', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } =
    jest.requireActual<typeof import('react-native')>('react-native');
  const MockIcon = () => ReactModule.createElement(MockView);
  return {
    BellIcon: MockIcon,
    ThemeToggleIcon: MockIcon,
    PlusIcon: MockIcon,
    ChevronRightIcon: MockIcon,
    TrendingUpIcon: MockIcon,
    FireIcon: MockIcon,
    MedalIcon: MockIcon,
  };
});

describe('HomeScreen', () => {
  it('shows nutrition values returned by the authenticated profile', () => {
    const navigation = { navigate: jest.fn() };
    const screen = render(
      <HomeScreen navigation={navigation as never} route={{} as never} />,
    );

    expect(screen.getByText('Olá, Nicolly')).toBeTruthy();
    expect(screen.getByText('1780')).toBeTruthy();
    expect(screen.getByText('2500')).toBeTruthy();
    expect(screen.getByText('2759')).toBeTruthy();
    expect(screen.getByText('TMB')).toBeTruthy();
    expect(screen.getByText('TDEE')).toBeTruthy();
    expect(screen.queryByText('2200')).toBeNull();
    expect(screen.queryByText('1450')).toBeNull();
  });
});
