import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFoodSuggestions } from './useFoodSuggestions';
import { suggestFoods } from '@/api/foods';
import type { FoodSuggestionsResult } from '@/api/foods';
import { ApiError } from '@/api/ApiError';

jest.mock('@/api/foods', () => ({ suggestFoods: jest.fn() }));

const mockSuggest = jest.mocked(suggestFoods);

const food = (id: string, name: string) => ({
  id,
  name,
  brand: null,
  source: 'TBCA',
  externalId: null,
  barcode: null,
  nutritionPer100g: {
    calories: 100,
    protein: 1,
    carbohydrates: 1,
    fat: 1,
    fiber: 0,
  },
});

const suggestionResult = (
  items: ReturnType<typeof food>[],
  externalStatus: FoodSuggestionsResult['externalStatus'] = 'AVAILABLE',
): FoodSuggestionsResult => ({ items, externalStatus });

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
    queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: 0 } },
    });
    mockSuggest.mockResolvedValue(suggestionResult([food('1', 'Frango frito')]));
  });

  afterEach(() => {
    queryClient.clear();
    jest.useRealTimers();
  });

  it('does nothing with fewer than 3 characters', async () => {
    const { result } = renderHook(({ text }) => useFoodSuggestions(text), {
      wrapper,
      initialProps: { text: 'f' },
    });

    await flush(1000);

    expect(mockSuggest).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([]);
  });

  it('waits for a typing pause (650 ms) and searches only once', async () => {
    const { result, rerender } = renderHook(({ text }) => useFoodSuggestions(text), {
      wrapper,
      initialProps: { text: '' },
    });

    rerender({ text: 'fr' });
    await flush(200);
    rerender({ text: 'fra' });
    await flush(400);
    rerender({ text: 'fran' });
    await flush(649);
    expect(mockSuggest).not.toHaveBeenCalled();

    await flush(2);
    await flush(0);
    expect(mockSuggest).toHaveBeenCalledTimes(1);
    expect(mockSuggest.mock.calls[0][0]).toBe('fran');
    expect(result.current.suggestions.map((f) => f.name)).toEqual(['Frango frito']);
  });

  it('ignores a late answer for an old text (only the latest text shows)', async () => {
    let resolveOld: (result: FoodSuggestionsResult) => void = () => undefined;
    mockSuggest.mockImplementation((query: string) => {
      if (query === 'fra') return new Promise((resolve) => (resolveOld = resolve));
      return Promise.resolve(suggestionResult([food('2', 'Frango grelhado')]));
    });

    const { result, rerender } = renderHook(({ text }) => useFoodSuggestions(text), {
      wrapper,
      initialProps: { text: '' },
    });
    rerender({ text: 'fra' });
    await flush(650); // dispara a busca de "fra" (que fica pendente)
    expect(mockSuggest).toHaveBeenCalledWith('fra', expect.anything());

    rerender({ text: 'fran' });
    await flush(650);
    await flush(0);
    expect(result.current.suggestions.map((f) => f.name)).toEqual(['Frango grelhado']);

    // a resposta de "fra" chega atrasada: não pode virar a lista
    await act(async () => {
      resolveOld(suggestionResult([food('1', 'Fraldas de pano')]));
    });
    await flush(0);

    expect(result.current.suggestions.map((f) => f.name)).toEqual(['Frango grelhado']);
  });

  it('discards the previous list while the new text loads', async () => {
    let resolveNew: (result: FoodSuggestionsResult) => void = () => undefined;
    mockSuggest.mockImplementation((query: string) =>
      query === 'frango'
        ? new Promise((resolve) => (resolveNew = resolve))
        : Promise.resolve(suggestionResult([food('1', 'Frango frito')])),
    );

    const { result, rerender } = renderHook(({ text }) => useFoodSuggestions(text), {
      wrapper,
      initialProps: { text: 'fran' },
    });
    await flush(650);
    expect(result.current.suggestions).toHaveLength(1);

    rerender({ text: 'frango' });
    await flush(650);

    expect(result.current.isLoading).toBe(true);
    expect(result.current.suggestions).toEqual([]);

    await act(async () => {
      resolveNew(suggestionResult([food('3', 'Frango assado')]));
    });
    await flush(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.suggestions.map((f) => f.name)).toEqual(['Frango assado']);
  });

  it('classifies a network error separately', async () => {
    mockSuggest.mockRejectedValue(new ApiError({ message: 'sem rede' }));
    const { result } = renderHook(() => useFoodSuggestions('frango'), {
      wrapper,
    });

    await flush(650);
    await flush(0);

    expect(result.current.isError).toBe(true);
    expect(result.current.errorKind).toBe('network');
    expect(result.current.suggestions).toEqual([]);
  });

  it('reports external unavailability without treating it as a connection error', async () => {
    mockSuggest.mockResolvedValue(suggestionResult([], 'UNAVAILABLE'));
    const { result } = renderHook(() => useFoodSuggestions('sorvete'), {
      wrapper,
    });

    await flush(650);
    await flush(0);

    expect(result.current.isError).toBe(false);
    expect(result.current.isExternalUnavailable).toBe(true);
  });

  it('empties the list when the text goes below 3 characters', async () => {
    const { result, rerender } = renderHook(({ text }) => useFoodSuggestions(text), {
      wrapper,
      initialProps: { text: 'fra' },
    });
    await flush(650);
    expect(result.current.suggestions).toHaveLength(1);

    rerender({ text: 'fr' });
    expect(result.current.suggestions).toEqual([]);
  });
});
