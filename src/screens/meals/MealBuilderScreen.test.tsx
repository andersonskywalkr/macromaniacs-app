import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { MealBuilderScreen } from './MealBuilderScreen';
import { useMealDraftStore } from '@/store/mealDraftStore';

const food = (id: string, name: string, calories: number, protein: number) => ({
  id,
  name,
  brand: null,
  source: 'TBCA' as const,
  externalId: null,
  barcode: null,
  nutritionPer100g: { calories, protein, carbohydrates: 0, fat: 0, fiber: 0 },
});

const rice = food('food-1', 'Arroz branco cozido', 100, 2);
const chicken = food('food-3', 'Peito de frango grelhado', 160, 32);

const mockMutateAsync = jest.fn();

jest.mock('@/queries/useCreateMeal', () => ({
  useCreateMeal: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));
jest.mock('@react-navigation/native', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  return {
    useFocusEffect: (effect: () => void | (() => void)) => ReactModule.useEffect(effect, [effect]),
  };
});
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
  const MockIcon = () => ReactModule.createElement(MockView);
  return { ChevronRightIcon: MockIcon, EyeIcon: MockIcon, EyeOffIcon: MockIcon };
});

function renderScreen() {
  const navigation = { navigate: jest.fn(), reset: jest.fn(), goBack: jest.fn() };
  const screen = render(
    <MealBuilderScreen navigation={navigation as never} route={{} as never} />,
  );
  return { navigation, screen };
}

function isDisabled(button: { props: { accessibilityState?: { disabled?: boolean } } }) {
  return Boolean(button.props.accessibilityState?.disabled);
}

describe('MealBuilderScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMealDraftStore.getState().clear();
  });

  it('shows the empty state and keeps "Salvar refeição" disabled with an empty draft', () => {
    const { screen } = renderScreen();

    expect(screen.getByText('Nenhum alimento no prato')).toBeTruthy();
    expect(isDisabled(screen.getByLabelText('Salvar refeição'))).toBe(true);
  });

  it('lists the draft with the meal total', () => {
    useMealDraftStore.getState().addItem({ food: rice, amountGrams: 150 });
    useMealDraftStore.getState().addItem({ food: chicken, amountGrams: 120 });
    const { screen } = renderScreen();

    expect(screen.getByText('Arroz branco cozido')).toBeTruthy();
    expect(screen.getByText('Peito de frango grelhado')).toBeTruthy();
    // 150 g de arroz = 150 kcal + 120 g de frango = 192 kcal
    expect(screen.getByLabelText('342 calorias no total')).toBeTruthy();
    expect(isDisabled(screen.getByLabelText('Salvar refeição'))).toBe(false);
  });

  it('edits and removes items, validating the amount', () => {
    useMealDraftStore.getState().addItem({ food: rice, amountGrams: 100 });
    useMealDraftStore.getState().addItem({ food: chicken, amountGrams: 100 });
    const { screen } = renderScreen();

    fireEvent.changeText(screen.getByLabelText('Quantidade de Arroz branco cozido em gramas'), '200');
    expect(useMealDraftStore.getState().items[0].amountGrams).toBe(200);

    fireEvent.changeText(screen.getByLabelText('Quantidade de Arroz branco cozido em gramas'), '0');
    expect(screen.getByText('A quantidade deve ser maior que zero.')).toBeTruthy();
    expect(isDisabled(screen.getByLabelText('Salvar refeição'))).toBe(true);
    // valor inválido não entra no rascunho
    expect(useMealDraftStore.getState().items[0].amountGrams).toBe(200);

    fireEvent.press(screen.getByLabelText('Remover Peito de frango grelhado da refeição'));
    expect(useMealDraftStore.getState().items.map((i) => i.food.id)).toEqual(['food-1']);
  });

  it('goes back to the search to add another food', () => {
    useMealDraftStore.getState().addItem({ food: rice, amountGrams: 100 });
    const { navigation, screen } = renderScreen();

    fireEvent.press(screen.getByLabelText('Adicionar alimento'));

    expect(navigation.navigate).toHaveBeenCalledWith('FoodSearch');
  });

  it('saves the meal, clears the draft and opens the meal detail', async () => {
    useMealDraftStore.getState().addItem({ food: rice, amountGrams: 150 });
    useMealDraftStore.getState().addItem({ food: chicken, amountGrams: 120 });
    mockMutateAsync.mockResolvedValue({ id: 'meal-99' });
    const { navigation, screen } = renderScreen();

    fireEvent.press(screen.getByLabelText('Almoço'));
    fireEvent.press(screen.getByLabelText('Salvar refeição'));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockMutateAsync).toHaveBeenCalledWith({
      mealType: 'LUNCH',
      name: undefined,
      consumedAt: expect.any(String),
      items: [
        { foodId: 'food-1', amountGrams: 150 },
        { foodId: 'food-3', amountGrams: 120 },
      ],
    });
    await waitFor(() => expect(useMealDraftStore.getState().items).toEqual([]));
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 1,
      routes: [{ name: 'MealsHome' }, { name: 'MealReview', params: { mealId: 'meal-99' } }],
    });
  });

  it('shows an error and keeps the draft when saving fails', async () => {
    useMealDraftStore.getState().addItem({ food: rice, amountGrams: 150 });
    mockMutateAsync.mockRejectedValue(new Error('boom'));
    const { navigation, screen } = renderScreen();

    fireEvent.press(screen.getByLabelText('Salvar refeição'));

    expect(await screen.findByText('Não foi possível salvar a refeição. Tente novamente.')).toBeTruthy();
    expect(useMealDraftStore.getState().items).toHaveLength(1);
    expect(navigation.reset).not.toHaveBeenCalled();
  });
});
