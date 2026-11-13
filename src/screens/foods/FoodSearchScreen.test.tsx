import React from 'react';
import { Alert } from 'react-native';
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

let mockSuggestions: {
  suggestions: unknown[];
  isLoading: boolean;
  isError: boolean;
  isSettled: boolean;
};
let mockHistoryItems: string[];
const mockHistoryAdd = jest.fn();
const mockHistoryRemove = jest.fn();
const mockHistoryClear = jest.fn();

jest.mock('@/queries/useFoodsSearch', () => ({
  useFoodsSearch: (...args: unknown[]) => {
    mockUseFoodsSearch(...args);
    return { ...mockSearchResult, refetch: jest.fn() };
  },
}));
jest.mock('@/queries/useFoodSuggestions', () => ({
  useFoodSuggestions: () => mockSuggestions,
}));
jest.mock('@/hooks/useSearchHistory', () => ({
  useSearchHistory: () => ({
    items: mockHistoryItems,
    add: mockHistoryAdd,
    remove: mockHistoryRemove,
    clear: mockHistoryClear,
  }),
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
      track: '#222',
      danger: '#f88',
    },
  }),
}));
jest.mock('@/components/icons', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } =
    jest.requireActual<typeof import('react-native')>('react-native');
  const MockIcon = () => ReactModule.createElement(MockView);
  return { ChevronRightIcon: MockIcon, EyeIcon: MockIcon, EyeOffIcon: MockIcon };
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

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchResult = { data: undefined, isLoading: false, isError: false };
  mockSuggestions = { suggestions: [], isLoading: false, isError: false, isSettled: false };
  mockHistoryItems = [];
});

describe('FoodSearchScreen', () => {
  it('does not search until the user presses "Buscar"', () => {
    const { screen } = renderScreen();

    fireEvent.changeText(screen.getByLabelText('Nome ou marca do alimento'), 'frango');

    expect(mockUseFoodsSearch).toHaveBeenLastCalledWith('', false);
    expect(screen.getByText('Busque um alimento')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Buscar'));

    expect(mockUseFoodsSearch).toHaveBeenLastCalledWith('frango', true);
  });

  it('blocks a search with fewer than 2 letters, with a message and no API call', () => {
    const { screen } = renderScreen();

    search(screen, 'a');

    expect(screen.getByText('Digite pelo menos 2 letras para buscar.')).toBeTruthy();
    expect(mockUseFoodsSearch).not.toHaveBeenCalledWith('a', true);
    expect(screen.getByText('Busque um alimento')).toBeTruthy();

    // digitar de novo limpa o aviso
    fireEvent.changeText(screen.getByLabelText('Nome ou marca do alimento'), 'ar');
    expect(screen.queryByText('Digite pelo menos 2 letras para buscar.')).toBeNull();
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

describe('FoodSearchScreen suggestions and history', () => {
  const field = (screen: ReturnType<typeof render>) =>
    screen.getByLabelText('Nome ou marca do alimento');

  it('shows the quick suggestions while typing, starting with "Buscar por..."', () => {
    mockSuggestions = {
      suggestions: [food('2', 'Frango frito'), food('1', 'Frango grelhado')],
      isLoading: false,
      isError: false,
      isSettled: true,
    };
    const { screen } = renderScreen();

    fireEvent.changeText(field(screen), 'frango fr');

    expect(screen.getByLabelText('Buscar por frango fr')).toBeTruthy();
    expect(screen.getByLabelText('Frango frito, 100 calorias por 100 gramas')).toBeTruthy();
    expect(screen.getByLabelText('Frango grelhado, 100 calorias por 100 gramas')).toBeTruthy();
    // nenhuma busca completa foi disparada só por digitar
    expect(mockUseFoodsSearch).toHaveBeenLastCalledWith('', false);
  });

  it('does not show suggestions with fewer than 2 characters', () => {
    const { screen } = renderScreen();

    fireEvent.changeText(field(screen), 'f');

    expect(screen.queryByLabelText('Buscar por f')).toBeNull();
  });

  it('opens the confirmation directly when a suggestion is tapped, and remembers it', () => {
    mockSuggestions = {
      suggestions: [food('2', 'Frango frito')],
      isLoading: false,
      isError: false,
      isSettled: true,
    };
    const { navigation, screen } = renderScreen();

    fireEvent.changeText(field(screen), 'frango');
    fireEvent.press(screen.getByLabelText('Frango frito, 100 calorias por 100 gramas'));

    expect(navigation.navigate).toHaveBeenCalledWith('FoodConfirm', {
      food: expect.objectContaining({ id: '2' }),
    });
    expect(mockHistoryAdd).toHaveBeenCalledWith('Frango frito');
    // sem nova busca completa
    expect(mockUseFoodsSearch).not.toHaveBeenCalledWith('frango', true);
  });

  it('runs the full search from "Buscar por..." and saves the term', () => {
    const { screen } = renderScreen();

    fireEvent.changeText(field(screen), 'frango fr');
    fireEvent.press(screen.getByLabelText('Buscar por frango fr'));

    expect(mockUseFoodsSearch).toHaveBeenLastCalledWith('frango fr', true);
    expect(mockHistoryAdd).toHaveBeenCalledWith('frango fr');
  });

  it('says there is no suggestion and points to the full search', () => {
    mockSuggestions = { suggestions: [], isLoading: false, isError: false, isSettled: true };
    const { screen } = renderScreen();

    fireEvent.changeText(field(screen), 'xyzw');

    expect(
      screen.getByText('Nenhuma sugestão. Toque em Buscar para procurar em todas as fontes.'),
    ).toBeTruthy();
  });

  it('keeps a silent error: no message, and the full search is still there', () => {
    mockSuggestions = { suggestions: [], isLoading: false, isError: true, isSettled: false };
    const { screen } = renderScreen();

    fireEvent.changeText(field(screen), 'frango');

    expect(screen.getByLabelText('Buscar por frango')).toBeTruthy();
    expect(screen.queryByText(/Não foi possível/)).toBeNull();
  });

  it('shows a small loading indicator without hiding the previous list', () => {
    mockSuggestions = {
      suggestions: [food('2', 'Frango frito')],
      isLoading: true,
      isError: false,
      isSettled: false,
    };
    const { screen } = renderScreen();

    fireEvent.changeText(field(screen), 'frango');

    expect(screen.getByLabelText('Carregando sugestões')).toBeTruthy();
    expect(screen.getByLabelText('Frango frito, 100 calorias por 100 gramas')).toBeTruthy();
  });

  it('shows the recent searches when the field is empty and focused', () => {
    mockHistoryItems = ['frango grelhado', 'arroz'];
    const { screen } = renderScreen();

    expect(screen.queryByText('BUSCAS RECENTES')).toBeNull();
    fireEvent(field(screen), 'focus');

    expect(screen.getByText('BUSCAS RECENTES')).toBeTruthy();
    expect(screen.getByLabelText('Buscar de novo por frango grelhado')).toBeTruthy();
    expect(screen.getByLabelText('Remover arroz do histórico')).toBeTruthy();
  });

  it('does not show the recent searches section when there is no history', () => {
    const { screen } = renderScreen();
    fireEvent(field(screen), 'focus');
    expect(screen.queryByText('BUSCAS RECENTES')).toBeNull();
  });

  it('fills the field and runs the full search when a recent search is tapped', () => {
    mockHistoryItems = ['frango grelhado'];
    const { screen } = renderScreen();

    fireEvent(field(screen), 'focus');
    fireEvent.press(screen.getByLabelText('Buscar de novo por frango grelhado'));

    expect(field(screen).props.value).toBe('frango grelhado');
    expect(mockUseFoodsSearch).toHaveBeenLastCalledWith('frango grelhado', true);
  });

  it('removes one item, and clears everything only after confirming', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockHistoryItems = ['frango grelhado', 'arroz'];
    const { screen } = renderScreen();

    fireEvent(field(screen), 'focus');
    fireEvent.press(screen.getByLabelText('Remover arroz do histórico'));
    expect(mockHistoryRemove).toHaveBeenCalledWith('arroz');

    fireEvent.press(screen.getByLabelText('Limpar histórico'));
    expect(mockHistoryClear).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(
      'Limpar histórico?',
      expect.any(String),
      expect.arrayContaining([expect.objectContaining({ text: 'Limpar' })]),
    );

    alert.mock.calls[0][2]?.find((button) => button.text === 'Limpar')?.onPress?.();
    expect(mockHistoryClear).toHaveBeenCalled();
    alert.mockRestore();
  });
});
