import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFoodSuggestions } from './useFoodSuggestions';
import { suggestFoods } from '@/api/foods';

jest.mock('@/api/foods', () => ({ suggestFoods: jest.fn() }));

const mockSuggest = jest.mocked(suggestFoods);

const food = (id: string, name: string) => ({
  id,
  name,
  brand: null,
  source: 'TBCA',
  externalId: null,
  barcode: null,
  nutritionPer100g: { calories: 100, protein: 1, carbohydrates: 1, fat: 1, fiber: 0 },
});

let queryClient: QueryClient;

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function flush(ms = 0) {
  return act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

describe('useFoodSuggestions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
    mockSuggest.mockResolvedValue([food('1', 'Frango frito')]);
  });

  afterEach(() => {
    queryClient.clear();
    jest.useRealTimers();
  });

  it('does nothing with fewer than 2 characters', async () => {
    const { result } = renderHook(({ text }) => useFoodSuggestions(text), {
      wrapper,
      initialProps: { text: 'f' },
    });

    await flush(1000);

    expect(mockSuggest).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([]);
  });

  it('waits for a typing pause (300 ms) and searches only once', async () => {
    const { result, rerender } = renderHook(({ text }) => useFoodSuggestions(text), {
      wrapper,
      initialProps: { text: '' },
    });

    rerender({ text: 'fr' });
    await flush(200);
    rerender({ text: 'fra' });
    await flush(200);
    rerender({ text: 'fran' });
    await flush(299);
    expect(mockSuggest).not.toHaveBeenCalled();

    await flush(2);
    await flush(0);
    expect(mockSuggest).toHaveBeenCalledTimes(1);
    expect(mockSuggest.mock.calls[0][0]).toBe('fran');
    expect(result.current.suggestions.map((f) => f.name)).toEqual(['Frango frito']);
  });

  it('ignores a late answer for an old text (only the latest text shows)', async () => {
    let resolveOld: (foods: ReturnType<typeof food>[]) => void = () => undefined;
    mockSuggest.mockImplementation((query: string) => {
      if (query === 'fra') return new Promise((resolve) => (resolveOld = resolve));
      return Promise.resolve([food('2', 'Frango grelhado')]);
    });

    const { result, rerender } = renderHook(({ text }) => useFoodSuggestions(text), {
      wrapper,
      initialProps: { text: '' },
    });
    rerender({ text: 'fra' });
    await flush(300); // dispara a busca de "fra" (que fica pendente)
    expect(mockSuggest).toHaveBeenCalledWith('fra', expect.anything());

    rerender({ text: 'fran' });
    await flush(300);
    await flush(0);
    expect(result.current.suggestions.map((f) => f.name)).toEqual(['Frango grelhado']);

    // a resposta de "fra" chega atrasada: não pode virar a lista
    await act(async () => {
      resolveOld([food('1', 'Fraldas de pano')]);
    });
    await flush(0);

    expect(result.current.suggestions.map((f) => f.name)).toEqual(['Frango grelhado']);
  });

  it('keeps the previous list while the new text loads, marking it as loading', async () => {
    let resolveNew: (foods: ReturnType<typeof food>[]) => void = () => undefined;
    mockSuggest.mockImplementation((query: string) =>
      query === 'frango' ? new Promise((resolve) => (resolveNew = resolve)) : Promise.resolve([food('1', 'Frango frito')]),
    );

    const { result, rerender } = renderHook(({ text }) => useFoodSuggestions(text), {
      wrapper,
      initialProps: { text: 'fran' },
    });
    await flush(300);
    expect(result.current.suggestions).toHaveLength(1);

    rerender({ text: 'frango' });
    await flush(300);

    expect(result.current.isLoading).toBe(true);
    expect(result.current.suggestions.map((f) => f.name)).toEqual(['Frango frito']);

    await act(async () => {
      resolveNew([food('3', 'Frango assado')]);
    });
    await flush(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.suggestions.map((f) => f.name)).toEqual(['Frango assado']);
  });

  it('keeps silent on a network error', async () => {
    mockSuggest.mockRejectedValue(new Error('sem rede'));
    const { result } = renderHook(() => useFoodSuggestions('frango'), { wrapper });

    await flush(300);
    await flush(0);

    expect(result.current.isError).toBe(true);
    expect(result.current.suggestions).toEqual([]);
  });

  it('empties the list when the text goes below 2 characters', async () => {
    const { result, rerender } = renderHook(({ text }) => useFoodSuggestions(text), {
      wrapper,
      initialProps: { text: 'fr' },
    });
    await flush(300);
    expect(result.current.suggestions).toHaveLength(1);

    rerender({ text: 'f' });
    expect(result.current.suggestions).toEqual([]);
  });
});
