import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileHomeScreen } from './ProfileHomeScreen';
import { useThemeStore } from '@/store/themeStore';

// O "armazenamento" fica no globalThis pra sobreviver ao jest.isolateModules
// (que recarrega o mock do AsyncStorage junto com o store).
const storage = globalThis as unknown as { __savedTheme?: string | null };

const mockUser = {
  id: 'u1',
  username: 'anderson',
  email: 'a@b.c',
  displayName: 'Anderson',
  goal: 'LOSE_WEIGHT',
  targetWeightKg: 75,
  currentMeasurement: { weightKg: 82.5, heightCm: 178 },
  nutrition: { calorieTargetKcalPerDay: 2500 },
};
const mockSignOut = jest.fn();
const mockRefetchGamification = jest.fn();
const mockRefetchProgress = jest.fn();

type QueryState = { data?: unknown; isLoading: boolean; isError: boolean };
let mockGamification: QueryState;
let mockProgress: QueryState;

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = globalThis as unknown as { __savedTheme?: string | null };
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async () => store.__savedTheme ?? null),
      setItem: jest.fn(async (_key: string, value: string) => {
        store.__savedTheme = value;
      }),
      removeItem: jest.fn(),
    },
  };
});
jest.mock('@/store/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: (state: unknown) => unknown) => selector({ user: mockUser }),
    { getState: () => ({ signOut: mockSignOut }) },
  ),
}));
jest.mock('@/queries/useGamificationStats', () => ({
  useGamificationStats: () => ({ ...mockGamification, refetch: mockRefetchGamification }),
}));
jest.mock('@/queries/useProgressToday', () => ({
  useProgressToday: () => ({ ...mockProgress, refetch: mockRefetchProgress }),
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
      ring: '#8b5cf6',
      track: '#222',
      danger: '#f88',
      shadow: '#000',
    },
  }),
}));
jest.mock('@/components/Avatar', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Avatar: () => ReactModule.createElement(MockView) };
});
jest.mock('@/components/ProgressRing', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } = jest.requireActual<typeof import('react-native')>('react-native');
  return { ProgressRing: () => ReactModule.createElement(MockView) };
});
jest.mock('@/components/icons', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } = jest.requireActual<typeof import('react-native')>('react-native');
  return { FireIcon: () => ReactModule.createElement(MockView) };
});

function renderProfile(params?: { saved?: boolean }) {
  const navigation = { navigate: jest.fn(), setParams: jest.fn() };
  const screen = render(
    <ProfileHomeScreen
      navigation={navigation as never}
      route={{ params } as never}
    />,
  );
  return { navigation, screen };
}

describe('ProfileHomeScreen', () => {
  beforeEach(() => {
    storage.__savedTheme = null;
    useThemeStore.setState({ preference: 'system' });
    jest.clearAllMocks();
    mockGamification = {
      data: { points: 420, currentStreak: 5, bestStreak: 12 },
      isLoading: false,
      isError: false,
    };
    mockProgress = {
      data: {
        calories: { goal: 2500, consumed: 600 },
        protein: { goal: 160, consumed: 0 },
        carbohydrates: { goal: 280, consumed: 0 },
        fat: { goal: 80, consumed: 0 },
      },
      isLoading: false,
      isError: false,
    };
  });

  it('shows the header, today, points and the goal summary', () => {
    const { screen } = renderProfile();

    expect(screen.getByText('Anderson')).toBeTruthy();
    expect(screen.getByText('@anderson')).toBeTruthy();
    expect(screen.getByText('a@b.c')).toBeTruthy();
    expect(screen.getByText('1900 kcal restantes')).toBeTruthy();
    expect(screen.getByText('Meta de hoje: 2500 kcal')).toBeTruthy();
    expect(screen.getByText('420')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('Emagrecimento')).toBeTruthy();
    expect(screen.getByText('2500 kcal/dia')).toBeTruthy();
    expect(screen.getByText('82,5 kg')).toBeTruthy();
    expect(screen.getByText('75 kg')).toBeTruthy();
  });

  it('opens the profile editor', () => {
    const { navigation, screen } = renderProfile();

    fireEvent.press(screen.getByLabelText('Editar perfil'));

    expect(navigation.navigate).toHaveBeenCalledWith('EditProfile');
  });

  it('keeps the rest of the profile when gamification fails, with a retry only there', () => {
    mockGamification = { data: undefined, isLoading: false, isError: true };
    const { screen } = renderProfile();

    expect(screen.getByText('Anderson')).toBeTruthy();
    expect(screen.getByText('1900 kcal restantes')).toBeTruthy();
    expect(screen.getByText('Emagrecimento')).toBeTruthy();
    expect(screen.getByText('Não foi possível carregar seus pontos e sua sequência.')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Tentar de novo'));
    expect(mockRefetchGamification).toHaveBeenCalledTimes(1);
    expect(mockRefetchProgress).not.toHaveBeenCalled();
  });

  it('shows a retry in the "hoje" card when the progress fails', () => {
    mockProgress = { data: undefined, isLoading: false, isError: true };
    const { screen } = renderProfile();

    expect(screen.getByText('Não foi possível carregar o seu dia.')).toBeTruthy();
    expect(screen.getByText('420')).toBeTruthy();
  });

  it('shows a short confirmation after the profile was saved', () => {
    const { navigation, screen } = renderProfile({ saved: true });

    expect(screen.getByText('Perfil atualizado.')).toBeTruthy();
    expect(navigation.setParams).toHaveBeenCalledWith({ saved: undefined });
  });

  it('asks for confirmation before signing out', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { screen } = renderProfile();

    fireEvent.press(screen.getByLabelText('Sair'));

    expect(mockSignOut).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(
      'Sair da conta?',
      expect.any(String),
      expect.arrayContaining([expect.objectContaining({ text: 'Sair' })]),
    );

    const buttons = alert.mock.calls[0][2] ?? [];
    buttons.find((button) => button.text === 'Sair')?.onPress?.();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });
});

describe('theme choice in the profile', () => {
  beforeEach(() => {
    storage.__savedTheme = null;
    useThemeStore.setState({ preference: 'system' });
    jest.clearAllMocks();
    mockGamification = { data: { points: 0, currentStreak: 0, bestStreak: 0 }, isLoading: false, isError: false };
    mockProgress = { data: undefined, isLoading: true, isError: false };
  });

  it('offers Claro, Escuro and Automático, with Automático selected by default', () => {
    const { screen } = renderProfile();

    expect(screen.getByLabelText('Claro')).toBeTruthy();
    expect(screen.getByLabelText('Escuro')).toBeTruthy();
    expect(
      screen.getByLabelText('Automático (seguir o celular)').props.accessibilityState.selected,
    ).toBe(true);
  });

  it('applies the choice app-wide (store) and remembers it in storage', () => {
    const { screen } = renderProfile();

    fireEvent.press(screen.getByLabelText('Escuro'));

    expect(useThemeStore.getState().preference).toBe('dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('macromaniacs:theme-preference', 'dark');
    expect(screen.getByLabelText('Escuro').props.accessibilityState.selected).toBe(true);
  });

  it('restores the saved choice when the app opens again', async () => {
    storage.__savedTheme = 'light';

    let reopened: typeof useThemeStore | undefined;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      reopened = require('@/store/themeStore').useThemeStore;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(reopened?.getState().preference).toBe('light');
  });
});
