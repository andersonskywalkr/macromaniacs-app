import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { FoodConfirmScreen } from './FoodConfirmScreen';
import { useMealDraftStore } from '@/store/mealDraftStore';

const chicken = {
  id: 'food-3',
  name: 'Frango peito grelhado',
  brand: null,
  source: 'TBCA' as const,
  externalId: null,
  barcode: null,
  nutritionPer100g: { calories: 160, protein: 32, carbohydrates: 0, fat: 4, fiber: 0 },
};

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

let routesInStack: { name: string }[] = [{ name: 'FoodSearch' }, { name: 'FoodConfirm' }];

function renderScreen() {
  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    popTo: jest.fn(),
    getState: jest.fn(() => ({ routes: routesInStack })),
  };
  const screen = render(
    <FoodConfirmScreen
      navigation={navigation as never}
      route={{ params: { food: chicken } } as never}
    />,
  );
  return { navigation, screen };
}

describe('FoodConfirmScreen', () => {
  beforeEach(() => {
    useMealDraftStore.getState().clear();
    routesInStack = [{ name: 'FoodSearch' }, { name: 'FoodConfirm' }];
  });

  it('starts at 100 g and recalculates live when the amount changes', () => {
    const { screen } = renderScreen();

    expect(screen.getByLabelText('160 calorias')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Quantidade em gramas'), '250');

    expect(screen.getByLabelText('400 calorias')).toBeTruthy();
    expect(screen.getByText('80 g')).toBeTruthy();
    expect(screen.getByText('10 g')).toBeTruthy();
  });

  it('shows an inline error and blocks adding when the amount is invalid', () => {
    const { navigation, screen } = renderScreen();

    fireEvent.changeText(screen.getByLabelText('Quantidade em gramas'), '0');

    expect(screen.getByText('A quantidade deve ser maior que zero.')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Adicionar à refeição'));
    expect(useMealDraftStore.getState().items).toHaveLength(0);
    expect(navigation.reset).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('Quantidade em gramas'), '5001');
    expect(screen.getByText(/no máximo 5000 g/)).toBeTruthy();
  });

  it('saves the item in the meal draft and goes back to the meal flow', () => {
    const { navigation, screen } = renderScreen();

    fireEvent.changeText(screen.getByLabelText('Quantidade em gramas'), '150');
    fireEvent.press(screen.getByLabelText('Adicionar à refeição'));

    expect(useMealDraftStore.getState().items).toEqual([{ food: chicken, amountGrams: 150 }]);
    // primeira vez: o hub vira a raiz da pilha
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MealBuilder' }] });
  });

  it('returns to the meal hub when it is already open', () => {
    routesInStack = [{ name: 'MealBuilder' }, { name: 'FoodSearch' }, { name: 'FoodConfirm' }];
    const { navigation, screen } = renderScreen();

    fireEvent.press(screen.getByLabelText('Adicionar à refeição'));

    expect(navigation.popTo).toHaveBeenCalledWith('MealBuilder');
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  it.each([
    ['Substituir', 200],
    ['Somar à quantidade atual', 300],
  ])('when the food is already in the draft, "%s" gives %d g and keeps a single item', (choice, expected) => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    useMealDraftStore.getState().addItem({ food: chicken, amountGrams: 100 });
    const { navigation, screen } = renderScreen();

    fireEvent.changeText(screen.getByLabelText('Quantidade em gramas'), '200');
    fireEvent.press(screen.getByLabelText('Adicionar à refeição'));

    // nada muda até o usuário escolher
    expect(alert).toHaveBeenCalledTimes(1);
    expect(useMealDraftStore.getState().items[0].amountGrams).toBe(100);
    expect(navigation.reset).not.toHaveBeenCalled();

    alert.mock.calls[0][2]?.find((button) => button.text === choice)?.onPress?.();

    expect(useMealDraftStore.getState().items).toEqual([{ food: chicken, amountGrams: expected }]);
    alert.mockRestore();
  });

  it('blocks a sum above 5000 g with a message in the screen', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    useMealDraftStore.getState().addItem({ food: chicken, amountGrams: 4000 });
    const { screen } = renderScreen();

    fireEvent.changeText(screen.getByLabelText('Quantidade em gramas'), '1500');
    fireEvent.press(screen.getByLabelText('Adicionar à refeição'));
    act(() => {
      alert.mock.calls[0][2]?.find((button) => button.text === 'Somar à quantidade atual')?.onPress?.();
    });

    expect(await screen.findByText(/passa do limite/)).toBeTruthy();
    expect(useMealDraftStore.getState().items[0].amountGrams).toBe(4000);
    alert.mockRestore();
  });
});
