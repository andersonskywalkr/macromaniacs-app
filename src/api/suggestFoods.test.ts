import { httpClient } from './client';
import { searchFoods, suggestFoods } from './foods';

// Modo REAL: a busca completa NÃO manda external=false; as sugestões mandam
// external=false e limit=8.
jest.mock('./config', () => ({
  MOCK_LATENCY_MS: 0,
  USE_MOCK: false,
  USE_AUTH_MOCK: false,
}));
jest.mock('./client', () => ({
  httpClient: { get: jest.fn(), post: jest.fn() },
}));

const get = jest.mocked(httpClient.get);

const backendFood = (id: string, name: string) => ({
  id,
  name,
  source: 'TACO',
  externalId: null,
  barcode: null,
  caloriesPer100g: 100,
  proteinPer100g: 1,
  carbsPer100g: 1,
  fatPer100g: 1,
  fiberPer100g: 0,
});

describe('food search API (real mode)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('suggestions use GET /v1/foods with external=false and limit=8, and cancel with the signal', async () => {
    get.mockResolvedValue({ data: { items: [], meta: {} } });
    const controller = new AbortController();

    await suggestFoods('  frango fr ', controller.signal);

    expect(get).toHaveBeenCalledWith('/v1/foods', {
      params: { q: 'frango fr', page: 1, limit: 8, external: false },
      signal: controller.signal,
    });
  });

  it('the full search does not send external at all (the backend default searches external sources)', async () => {
    get.mockResolvedValue({ data: { items: [], meta: {} } });

    await searchFoods('frango');

    const config = get.mock.calls[0][1] as { params: Record<string, unknown> };
    expect(config.params).toEqual({ q: 'frango', page: 1, limit: 20 });
    expect(config.params).not.toHaveProperty('external');
  });

  it('reorders the backend result: starts with the text, then a word that starts with it, then the rest', async () => {
    get.mockResolvedValue({
      data: {
        items: [
          backendFood('1', 'Refrigerante'),
          backendFood('2', 'Peito de frango'),
          backendFood('3', 'Frango frito'),
          backendFood('4', 'Frango grelhado'),
        ],
        meta: {},
      },
    });

    const suggestions = await suggestFoods('fr');

    expect(suggestions.map((f) => f.name)).toEqual([
      'Frango frito',
      'Frango grelhado',
      'Peito de frango',
      'Refrigerante',
    ]);
    // o formato do backend foi convertido para o do app
    expect(suggestions[0].nutritionPer100g).toMatchObject({ calories: 100, carbohydrates: 1 });
  });

  it('never returns more than 8', async () => {
    get.mockResolvedValue({
      data: { items: Array.from({ length: 12 }, (_, i) => backendFood(String(i), `Frango ${i}`)), meta: {} },
    });
    expect(await suggestFoods('fr')).toHaveLength(8);
  });
});
