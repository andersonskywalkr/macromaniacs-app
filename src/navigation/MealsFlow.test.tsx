import React from 'react';
import { Alert, Pressable, Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MealsStackNavigator } from './MealsStack';
import { useMealDraftStore } from '@/store/mealDraftStore';
import { resetMockMeals } from '@/mocks/mealStore';
import { ThemeProvider } from '@/theme/ThemeProvider';

// Fluxo de verdade (pilha de navegação + telas + mock da API), sem mock de
// navegação: Refeições -> Busca -> Confirmação -> hub -> "Adicionar alimento"
// -> Busca -> Confirmação -> hub ... É o teste que protege o rascunho de
// refeição com VÁRIOS itens.

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(),
  },
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const Tab = createBottomTabNavigator();

// Simula a Home: o botão "Adicionar refeição" abre a Busca dentro da aba
// Refeições, igual ao HomeScreen real.
function FakeHome({ navigation }: { navigation: { navigate: (...args: unknown[]) => void } }) {
  return (
    <Pressable
      accessibilityLabel="Home: Adicionar refeição"
      onPress={() => navigation.navigate('MealsTab', { screen: 'FoodSearch' })}
    >
      <Text>Home</Text>
    </Pressable>
  );
}

let queryClient: QueryClient;

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NavigationContainer>{children}</NavigationContainer>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function renderFlow() {
  return render(
    <Providers>
      <MealsStackNavigator />
    </Providers>,
  );
}

function renderFlowFromHome() {
  return render(
    <Providers>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="HomeTab" component={FakeHome as never} />
        <Tab.Screen name="MealsTab" component={MealsStackNavigator} />
      </Tab.Navigator>
    </Providers>,
  );
}

async function search(term: string) {
  fireEvent.changeText(await screen.findByLabelText('Nome ou marca do alimento'), term);
  fireEvent.press(screen.getByLabelText('Buscar'));
  await screen.findByText('Confirmar alimento', undefined, { timeout: 3000 });
}

async function addFood(term: string, expectedTitle: string) {
  await search(term);
  expect(screen.getByText(expectedTitle)).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Adicionar à refeição'));
  await screen.findByText('Montar refeição');
}

describe('meal flow with the real navigation stack', () => {
  beforeEach(() => {
    // gcTime 0: sem timers de limpeza de cache (5 min) que seguram o Jest aberto
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
    });
    useMealDraftStore.getState().clear();
    resetMockMeals();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('accumulates four different foods in the same plate', async () => {
    renderFlow();

    fireEvent.press(await screen.findByLabelText('Adicionar refeição'));
    await addFood('arroz', 'Arroz branco cozido');
    expect(useMealDraftStore.getState().items).toHaveLength(1);

    for (const [term, name] of [
      ['feijão', 'Feijão carioca cozido'],
      ['peito de frango', 'Peito de frango grelhado'],
      ['mandioca', 'Mandioca cozida'],
    ]) {
      fireEvent.press(screen.getByLabelText('Adicionar alimento'));
      await addFood(term, name);
    }

    await waitFor(() => expect(useMealDraftStore.getState().items).toHaveLength(4));
    expect(useMealDraftStore.getState().items.map((i) => i.food.name)).toEqual([
      'Arroz branco cozido',
      'Feijão carioca cozido',
      'Peito de frango grelhado',
      'Mandioca cozida',
    ]);
    expect(screen.getByText('4 itens')).toBeTruthy();
    // total soma todos: 128 + 76 + 159 + 125 kcal (100 g de cada)
    expect(screen.getByLabelText('488 calorias no total')).toBeTruthy();
  }, 30000);

  it('accumulates foods when the flow starts from the Home button, and keeps the draft across tabs', async () => {
    renderFlowFromHome();

    fireEvent.press(await screen.findByLabelText('Home: Adicionar refeição'));
    await addFood('arroz', 'Arroz branco cozido');

    fireEvent.press(screen.getByLabelText('Adicionar alimento'));
    await addFood('feijão', 'Feijão carioca cozido');

    // sai da aba e volta
    fireEvent.press(screen.getByText('HomeTab'));
    await screen.findByLabelText('Home: Adicionar refeição');
    expect(useMealDraftStore.getState().items).toHaveLength(2);
    fireEvent.press(screen.getByLabelText('Home: Adicionar refeição'));
    await addFood('mandioca', 'Mandioca cozida');

    expect(useMealDraftStore.getState().items).toHaveLength(3);
    expect(screen.getByText('3 itens')).toBeTruthy();
  }, 30000);

  it('asks to sum or replace when the same food is added again', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    renderFlow();

    fireEvent.press(await screen.findByLabelText('Adicionar refeição'));
    await addFood('arroz', 'Arroz branco cozido');

    fireEvent.press(screen.getByLabelText('Adicionar alimento'));
    await search('arroz');
    fireEvent.press(screen.getByLabelText('Adicionar à refeição'));

    expect(alert).toHaveBeenCalledWith(
      'Alimento já está no prato',
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Somar à quantidade atual' }),
        expect.objectContaining({ text: 'Substituir' }),
      ]),
    );
    expect(useMealDraftStore.getState().items[0].amountGrams).toBe(100);

    const buttons = alert.mock.calls[0][2] ?? [];
    act(() => {
      buttons.find((b) => b.text === 'Somar à quantidade atual')?.onPress?.();
    });

    await screen.findByText('Montar refeição');
    expect(useMealDraftStore.getState().items).toHaveLength(1);
    expect(useMealDraftStore.getState().items[0].amountGrams).toBe(200);
    alert.mockRestore();
  }, 30000);

  it('saves a plate with a name and a type, shown separately in the detail and in the list', async () => {
    renderFlow();

    fireEvent.press(await screen.findByLabelText('Adicionar refeição'));
    await addFood('arroz', 'Arroz branco cozido');
    fireEvent.press(screen.getByLabelText('Adicionar alimento'));
    await addFood('feijão', 'Feijão carioca cozido');

    fireEvent.changeText(screen.getByLabelText('Nome da refeição, opcional'), 'Almoço de segunda');
    fireEvent.press(screen.getByLabelText('Almoço'));
    fireEvent.press(screen.getByLabelText('Salvar refeição'));

    await screen.findByText('Detalhe da refeição', undefined, { timeout: 3000 });
    expect(await screen.findByText('Almoço de segunda')).toBeTruthy();
    expect(screen.getByText('Arroz branco cozido')).toBeTruthy();
    expect(screen.getByText('Feijão carioca cozido')).toBeTruthy();
    expect(useMealDraftStore.getState().items).toEqual([]);

    fireEvent.press(screen.getByLabelText('Concluir'));
    expect(
      await screen.findByLabelText(/^Almoço de segunda, Almoço, \d{2}:\d{2}, 204 calorias, 2 itens$/),
    ).toBeTruthy();
  }, 30000);
});
