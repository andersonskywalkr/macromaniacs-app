import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { HistoryScreen } from './HistoryScreen';
import { buildPerformanceDays, lastDates } from '@/utils/performance';

type QueryState = { data?: unknown; isLoading: boolean; isError: boolean };
let mockPerformance: QueryState;
const mockRefetch = jest.fn();
const mockUsePerformance = jest.fn();

jest.mock('@/queries/useProgressHistory', () => ({
  usePerformance: (days: number) => {
    mockUsePerformance(days);
    return { ...mockPerformance, refetch: mockRefetch };
  },
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
      onPrimary: '#fff',
      protein: '#f00',
      carbs: '#fa0',
      fat: '#0f0',
      shadow: '#000',
    },
  }),
}));
jest.mock('@/components/icons', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } = jest.requireActual<typeof import('react-native')>('react-native');
  return { ChevronRightIcon: () => ReactModule.createElement(MockView) };
});

const entry = (date: string, calories: number) => ({
  date,
  calories,
  protein: 100,
  carbohydrates: 200,
  fat: 60,
  fiber: 20,
  mealCount: 3,
  targetCalories: 2000,
});

const dates = lastDates(7, '2026-10-22');
const weekDays = buildPerformanceDays(
  dates,
  [entry('2026-10-18', 1900), entry('2026-10-20', 1000), entry('2026-10-22', 2100)],
  2000,
);

function renderHistory(params?: { origin?: 'home' }) {
  const parent = { navigate: jest.fn() };
  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
    reset: jest.fn(),
    getParent: jest.fn(() => parent),
  };
  const screen = render(
    <HistoryScreen navigation={navigation as never} route={{ params } as never} />,
  );
  return { navigation, parent, screen };
}

describe('HistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance = { data: weekDays, isLoading: false, isError: false };
  });

  it('shows the summary cards and the day by day list for the week', () => {
    const { screen } = renderHistory();

    expect(mockUsePerformance).toHaveBeenCalledWith(7);
    expect(screen.getByText('2 de 7')).toBeTruthy(); // 1900 e 2100 batem a meta
    expect(screen.getByText('dias com meta batida')).toBeTruthy();
    expect(screen.getByText('1667 kcal')).toBeTruthy(); // média dos 3 dias com registro
    expect(screen.getByText('MELHOR DIA')).toBeTruthy();
    expect(screen.getByText('MÉDIA DE MACROS')).toBeTruthy();
    expect(screen.getByText('DIA POR DIA')).toBeTruthy();
    expect(screen.getByLabelText('qua 21/10: sem registro')).toBeTruthy();
  });

  it('draws an empty bar for a day without a record', () => {
    const { screen } = renderHistory();

    expect(screen.getByLabelText('seg 19/10: sem registro')).toBeTruthy();
    expect(screen.getByLabelText('dom 18/10: 1900 calorias, meta batida')).toBeTruthy();
    expect(screen.getByLabelText('ter 20/10: 1000 calorias')).toBeTruthy();
  });

  it('switches between week and month', () => {
    const { screen } = renderHistory();

    fireEvent.press(screen.getByLabelText('Mês'));
    expect(mockUsePerformance).toHaveBeenLastCalledWith(30);

    fireEvent.press(screen.getByLabelText('Semana'));
    expect(mockUsePerformance).toHaveBeenLastCalledWith(7);
  });

  it('shows the friendly empty state when nothing was registered', () => {
    mockPerformance = {
      data: buildPerformanceDays(dates, [], 2000),
      isLoading: false,
      isError: false,
    };
    const { screen } = renderHistory();

    expect(screen.getByText('Registre refeições para ver seu desempenho')).toBeTruthy();
    expect(screen.queryByText('MELHOR DIA')).toBeNull();
  });

  it('shows loading and the error state with a retry', () => {
    mockPerformance = { data: undefined, isLoading: true, isError: false };
    const loading = renderHistory();
    expect(loading.screen.getByLabelText('Carregando desempenho')).toBeTruthy();
    loading.screen.unmount();

    mockPerformance = { data: undefined, isLoading: false, isError: true };
    const failed = renderHistory();
    fireEvent.press(failed.screen.getByLabelText('Tentar de novo'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('goes back normally, and back to the Home when it came from the Home shortcut', () => {
    const normal = renderHistory();
    fireEvent.press(normal.screen.getByLabelText('Voltar'));
    expect(normal.navigation.goBack).toHaveBeenCalled();
    normal.screen.unmount();

    const fromHome = renderHistory({ origin: 'home' });
    fireEvent.press(fromHome.screen.getByLabelText('Voltar'));
    expect(fromHome.navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'ProfileHome' }],
    });
    expect(fromHome.parent.navigate).toHaveBeenCalledWith('HomeTab');
  });
});
