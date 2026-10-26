import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FoodSearchScreen } from './FoodSearchScreen';

const food = (id: string, name: string) => ({
  id,
  name,
  brand: null,
  source: 'TBCA',
  externalId: null,
  barcode: null,
  nutritionPer100g: { calories: 100, protein: 10, carbohydrates: 5, fat: 2, fiber: 0 },
});

let mockSearchResult: { data?: unknown[]; isLoading: boolean; isError: boolean };
const mockUseFoodsSearch = jest.fn();

jest.mock('@/queries/useFoodsSearch', () => ({
  useFoodsSearch: (...args: unknown[]) => {
    mockUseFoodsSearch(...args);
    return { ...mockSearchResult, refetch: jest.fn() };
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
  const { View: MockView } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return { ChevronRightIcon: () => ReactModule.createElement(MockView) };
});

function renderScreen() {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  const screen = render(<FoodSearchScreen navigation={navigation as never} route={{} as never} />);
  return { navigation, screen };
}

function search(screen: ReturnType<typeof render>, term: string) {
  fireEvent.changeText(screen.getByLabelText('Nome ou marca do alimento'), term);
  fireEvent.press(screen.getByLabelText('Buscar'));
}

describe('FoodSearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchResult = { data: undefined, isLoading: false, isError: false };
  });

  it('does not search until the user presses "Buscar"', () => {
    const { screen } = renderScreen();

    fireEvent.changeText(screen.getByLabelText('Nome ou marca do alimento'), 'frango');

    expect(mockUseFoodsSearch).toHaveBeenLastCalledWith('', false);
    expect(screen.getByText('Busque um alimento')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Buscar'));

    expect(mockUseFoodsSearch).toHaveBeenLastCalledWith('frango', true);
  });

  it('goes straight to the confirmation when there is a single result', () => {
    mockSearchResult = { data: [food('1', 'Banana prata')], isLoading: false, isError: false };
    const { navigation, screen } = renderScreen();

    search(screen, 'banana');

    expect(navigation.navigate).toHaveBeenCalledWith('FoodConfirm', {
      food: expect.objectContaining({ id: '1' }),
    });
  });

  it('lets the user choose when there is more than one result', () => {
    mockSearchResult = {
      data: [food('1', 'Frango grelhado'), food('2', 'Frango frito')],
      isLoading: false,
      isError: false,
    };
    const { navigation, screen } = renderScreen();

    search(screen, 'frango');

    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(screen.getByText('2 resultados')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Frango frito, 100 calorias por 100 gramas'));

    expect(navigation.navigate).toHaveBeenCalledWith('FoodConfirm', {
      food: expect.objectContaining({ id: '2' }),
    });
  });

  it('shows the empty state with the manual registration shortcut', () => {
    mockSearchResult = { data: [], isLoading: false, isError: false };
    const { navigation, screen } = renderScreen();

    search(screen, 'xyz');

    expect(screen.getByText('Nenhum alimento com esse nome')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Cadastrar alimento manualmente'));
    expect(navigation.navigate).toHaveBeenCalledWith('FoodManual');
  });

  it('shows the error state with a retry button', () => {
    mockSearchResult = { data: undefined, isLoading: false, isError: true };
    const { screen } = renderScreen();

    search(screen, 'frango');

    expect(screen.getByText('Não foi possível buscar')).toBeTruthy();
    expect(screen.getByLabelText('Tentar de novo')).toBeTruthy();
  });
});
