import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { MealsHomeScreen } from './MealsHomeScreen';
import { useMealDraftStore } from '@/store/mealDraftStore';

const meal = (
  id: string,
  mealType: string | null,
  name: string | null,
  consumedAt: string,
  calories: number,
) => ({
  id,
  userId: 'u',
  plannedMealId: null,
  mealType,
  name,
  photoUrl: null,
  consumedAt,
  items: [
    { id: `${id}-1`, foodId: 'f', foodName: 'F', amountGrams: 100, calories, protein: 10, carbs: 20, fat: 5, fiber: 0 },
  ],
});

let mockMeals: { data?: unknown[]; isLoading: boolean; isError: boolean };
const mockRefetch = jest.fn();

jest.mock('@/queries/useMealsToday', () => ({
  useMealsToday: () => ({ ...mockMeals, refetch: mockRefetch }),
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
  return { PlusIcon: () => ReactModule.createElement(MockView) };
});

function renderScreen() {
  const navigation = { navigate: jest.fn() };
  const screen = render(<MealsHomeScreen navigation={navigation as never} route={{} as never} />);
  return { navigation, screen };
}

describe('MealsHomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMealDraftStore.getState().clear();
    mockMeals = { data: [], isLoading: false, isError: false };
  });

  it('shows the empty state and opens the food search from "Adicionar refeição"', () => {
    const { navigation, screen } = renderScreen();

    expect(screen.getByText('Nenhuma refeição hoje')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Adicionar refeição'));
    expect(navigation.navigate).toHaveBeenCalledWith('FoodSearch');
  });

  it('continues the plate in progress instead of opening a new search', () => {
    useMealDraftStore.getState().addItem({
      food: {
        id: 'f',
        name: 'F',
        source: 'TBCA',
        externalId: null,
        barcode: null,
        nutritionPer100g: { calories: 1, protein: 1, carbohydrates: 1, fat: 1, fiber: 0 },
      },
      amountGrams: 100,
    });
    const { navigation, screen } = renderScreen();

    fireEvent.press(screen.getByLabelText('Adicionar refeição'));

    expect(navigation.navigate).toHaveBeenCalledWith('MealBuilder');
  });

  it('lists today meals with type, time, calories and items, and filters by type', () => {
    mockMeals = {
      data: [
        meal('1', 'BREAKFAST', null, '2026-01-05T08:20:00', 300),
        meal('2', 'LUNCH', 'Almoço de segunda', '2026-01-05T12:40:00', 600),
      ],
      isLoading: false,
      isError: false,
    };
    const { navigation, screen } = renderScreen();

    // com nome: nome em destaque + tipo (Badge); sem nome: só o tipo
    expect(
      screen.getByLabelText('Almoço de segunda, Almoço, 12:40, 600 calorias, 1 item'),
    ).toBeTruthy();
    expect(screen.getByLabelText('Café da manhã, 08:20, 300 calorias, 1 item')).toBeTruthy();
    expect(screen.getByText('Almoço de segunda')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Almoço', { exact: true }));
    expect(screen.queryByLabelText('Café da manhã, 08:20, 300 calorias, 1 item')).toBeNull();

    fireEvent.press(screen.getByLabelText('Jantar'));
    expect(screen.getByText('Nenhuma refeição desse tipo hoje')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Todas'));
    fireEvent.press(screen.getByLabelText('Almoço de segunda, Almoço, 12:40, 600 calorias, 1 item'));
    expect(navigation.navigate).toHaveBeenCalledWith('MealReview', { mealId: '2' });
  });

  it('shows the loading and error states', () => {
    mockMeals = { data: undefined, isLoading: true, isError: false };
    const loading = renderScreen();
    expect(loading.screen.getByLabelText('Carregando refeições')).toBeTruthy();
    loading.screen.unmount();

    mockMeals = { data: undefined, isLoading: false, isError: true };
    const failed = renderScreen();
    fireEvent.press(failed.screen.getByLabelText('Tentar de novo'));
    expect(mockRefetch).toHaveBeenCalled();
  });
});
