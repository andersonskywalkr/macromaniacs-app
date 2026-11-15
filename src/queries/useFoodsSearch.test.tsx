import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFoodsSearch } from './useFoodsSearch';
import { searchFoodsPage, type FoodSearchPage } from '@/api/foods';

jest.mock('@/api/foods', () => ({ searchFoodsPage: jest.fn() }));

const mockPage = jest.mocked(searchFoodsPage);

const food = (id: string, name: string) => ({
  id,
  name,
  brand: null,
  source: 'TBCA',
  externalId: null,
  barcode: null,
  nutritionPer100g: { calories: 100, protein: 1, carbohydrates: 1, fat: 1, fiber: 0 },
});

const page = (names: string[], pageNumber: number, totalPages: number, extra: Partial<FoodSearchPage> = {}): FoodSearchPage => ({
  items: names.map((name, i) => food(`${pageNumber}-${i}`, name)),
  meta: { page: pageNumber, totalPages },
  ...extra,
});

let queryClient: QueryClient;

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useFoodsSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('reorders the first page by relevance (the backend sorts by name)', async () => {
    mockPage.mockResolvedValue(
      page(
        ['Salgadinho sabor frango grelhado', 'Arroz com frango grelhado', 'Frango grelhado, arroz e creme', 'Frango grelhado'],
        1,
        1,
      ),
    );

    const { result } = renderHook(() => useFoodsSearch('Frango Grelhado', true), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.map((f) => f.name)).toEqual([
      'Frango grelhado',
      'Frango grelhado, arroz e creme',
      'Arroz com frango grelhado',
      'Salgadinho sabor frango grelhado',
    ]);
  });

  it('does not reshuffle what was already shown when the next page arrives', async () => {
    mockPage.mockResolvedValueOnce(page(['Arroz com frango grelhado', 'Frango grelhado com legumes'], 1, 2));
    mockPage.mockResolvedValueOnce(page(['Frango grelhado', 'Bolo sabor frango grelhado'], 2, 2));

    const { result } = renderHook(() => useFoodsSearch('frango grelhado', true), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    const firstPage = result.current.data?.map((f) => f.name);
    expect(firstPage).toEqual(['Frango grelhado com legumes', 'Arroz com frango grelhado']);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.data).toHaveLength(4));

    const all = result.current.data?.map((f) => f.name);
    // as já exibidas continuam no começo, na mesma ordem
    expect(all?.slice(0, 2)).toEqual(firstPage);
    // a página nova é reordenada só entre si, e entra depois
    expect(all?.slice(2)).toEqual(['Frango grelhado', 'Bolo sabor frango grelhado']);
  });

  it('keeps the existing pagination (next page = page + 1) and passes the page number', async () => {
    mockPage.mockResolvedValueOnce(page(['A'], 1, 3));
    mockPage.mockResolvedValueOnce(page(['B'], 2, 3));

    const { result } = renderHook(() => useFoodsSearch('aa', true), { wrapper });
    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(mockPage.mock.calls.map((call) => call[1])).toEqual([{ page: 1 }, { page: 2 }]);
  });

  it('reports when a page came only from the saved foods (503 on the external sources)', async () => {
    mockPage.mockResolvedValue(page(['Frango grelhado'], 1, 1, { externalUnavailable: true }));

    const { result } = renderHook(() => useFoodsSearch('frango', true), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.externalUnavailable).toBe(true);
  });

  it('is not unavailable by default, and does nothing until enabled with 2+ letters', async () => {
    mockPage.mockResolvedValue(page(['Frango grelhado'], 1, 1));

    const idle = renderHook(() => useFoodsSearch('frango', false), { wrapper });
    const short = renderHook(() => useFoodsSearch('f', true), { wrapper });
    expect(mockPage).not.toHaveBeenCalled();
    expect(idle.result.current.externalUnavailable).toBe(false);
    expect(short.result.current.data).toBeUndefined();

    const active = renderHook(() => useFoodsSearch('frango', true), { wrapper });
    await waitFor(() => expect(active.result.current.data).toBeDefined());
    expect(active.result.current.externalUnavailable).toBe(false);
  });
});
