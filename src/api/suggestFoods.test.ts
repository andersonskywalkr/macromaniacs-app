import { httpClient } from './client';
import { ApiError } from './ApiError';
import { EXTERNAL_SEARCH_TIMEOUT_MS, FOODS_PAGE_LIMIT, searchFoods, searchFoodsPage, suggestFoods } from './foods';
import { EXTERNAL_CALLS_PER_MINUTE, canCallExternal, recordExternalCall, resetExternalBudget } from './externalBudget';

// Modo REAL: a pesquisa rápida pede 50 itens, consulta também as fontes externas
// (external=true) e mostra os 8 mais relevantes; a busca completa não manda
// `external` (padrão do backend) e também pede 50.
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

const unavailable = () =>
  new ApiError({ statusCode: 503, error: 'Service Unavailable', message: 'Provedores externos indisponíveis', timestamp: '', path: '/v1/foods' });

describe('food search API (real mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetExternalBudget();
  });

  it('asks for 50 items', () => {
    expect(FOODS_PAGE_LIMIT).toBe(50);
  });

  it('suggestions use GET /v1/foods with external=true and limit=50, and cancel with the signal', async () => {
    get.mockResolvedValue({ data: { items: [], meta: {} } });
    const controller = new AbortController();

    await suggestFoods('  frango fr ', controller.signal);

    expect(get).toHaveBeenCalledWith('/v1/foods', {
      params: { q: 'frango fr', page: 1, limit: 50, external: true },
      signal: controller.signal,
      timeout: EXTERNAL_SEARCH_TIMEOUT_MS,
    });
  });

  it('the full search asks for 50 per page and does not send external (backend default)', async () => {
    get.mockResolvedValue({ data: { items: [], meta: {} } });

    await searchFoods('frango');

    const config = get.mock.calls[0][1] as { params: Record<string, unknown> };
    expect(config.params).toEqual({ q: 'frango', page: 1, limit: 50 });
    expect(config.params).not.toHaveProperty('external');
  });

  it('uses the same page size on the next pages', async () => {
    get.mockResolvedValue({ data: { items: [], meta: {} } });

    await searchFoods('frango', { page: 3 });

    expect((get.mock.calls[0][1] as { params: Record<string, unknown> }).params).toMatchObject({ page: 3, limit: 50 });
  });

  it('reorders by relevance: the plain food first, composite dishes and flavored snacks after', async () => {
    get.mockResolvedValue({
      data: {
        items: [
          backendFood('1', 'Salgadinho sabor frango grelhado'),
          backendFood('2', 'Arroz com frango grelhado'),
          backendFood('3', 'Frango grelhado, arroz integral e creme de milho'),
          backendFood('4', 'Frango grelhado'),
        ],
        meta: {},
      },
    });

    const { items } = await suggestFoods('Frango Grelhado');

    expect(items.map((f) => f.name)).toEqual([
      'Frango grelhado',
      'Frango grelhado, arroz integral e creme de milho',
      'Arroz com frango grelhado',
      'Salgadinho sabor frango grelhado',
    ]);
    // o formato do backend foi convertido para o do app
    expect(items[0].nutritionPer100g).toMatchObject({ calories: 100, carbohydrates: 1 });
  });

  it('finds the right food even when it comes late in the 50 (the backend sorts by name)', async () => {
    const noise = Array.from({ length: 45 }, (_, i) => backendFood(`n${i}`, `Arroz com frango grelhado ${i}`));
    get.mockResolvedValue({ data: { items: [...noise, backendFood('x', 'Frango grelhado')], meta: {} } });

    const { items } = await suggestFoods('frango grelhado');

    expect(items[0].name).toBe('Frango grelhado');
  });

  it('never returns more than 8', async () => {
    get.mockResolvedValue({
      data: { items: Array.from({ length: 12 }, (_, i) => backendFood(String(i), `Frango ${i}`)), meta: {} },
    });
    expect((await suggestFoods('fr')).items).toHaveLength(8);
  });

  it('marks the result as local only when the external providers fail (503), and still shows the saved foods', async () => {
    get.mockRejectedValueOnce(unavailable());
    get.mockResolvedValueOnce({ data: { items: [backendFood('1', 'Frango grelhado')], meta: {} } });

    const result = await suggestFoods('frango');

    expect(result.localOnly).toBe(true);
    expect(result.items.map((f) => f.name)).toEqual(['Frango grelhado']);
    expect(get).toHaveBeenCalledTimes(2);
    expect((get.mock.calls[0][1] as { params: Record<string, unknown> }).params).toMatchObject({ external: true });
    expect((get.mock.calls[1][1] as { params: Record<string, unknown> }).params).toMatchObject({ external: false });
    expect(get.mock.calls[1][1]).not.toHaveProperty('timeout');
  });

  it('does not hide other errors (only 503 falls back)', async () => {
    get.mockRejectedValue(new ApiError({ statusCode: 500, error: 'Internal', message: 'erro', timestamp: '', path: '' }));
    await expect(suggestFoods('frango')).rejects.toBeInstanceOf(ApiError);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('the full search also falls back to the saved foods on 503 and says so', async () => {
    get.mockRejectedValueOnce(unavailable());
    get.mockResolvedValueOnce({ data: { items: [backendFood('1', 'Frango grelhado')], meta: { page: 1, totalPages: 1 } } });

    const page = await searchFoodsPage('frango');

    expect(page.externalUnavailable).toBe(true);
    expect(page.items).toHaveLength(1);
  });

  it('a request that is already local (external=false) is not retried on 503', async () => {
    get.mockRejectedValue(unavailable());
    await expect(searchFoodsPage('frango', { external: false })).rejects.toBeInstanceOf(ApiError);
    expect(get).toHaveBeenCalledTimes(1);
  });
});

describe('rate limit of the external sources (10 per minute)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetExternalBudget();
    get.mockResolvedValue({ data: { items: [backendFood('1', 'Frango grelhado')], meta: {} } });
  });

  it('keeps the budget below the limit of 10', () => {
    expect(EXTERNAL_CALLS_PER_MINUTE).toBeLessThan(10);
  });

  it('after the budget is used, the quick search uses only the saved foods (external=false)', async () => {
    for (let i = 0; i < EXTERNAL_CALLS_PER_MINUTE; i += 1) await suggestFoods('frango');
    expect(get).toHaveBeenCalledTimes(EXTERNAL_CALLS_PER_MINUTE);

    get.mockClear();
    const result = await suggestFoods('frango');

    expect((get.mock.calls[0][1] as { params: Record<string, unknown> }).params).toMatchObject({ external: false });
    expect(get.mock.calls[0][1]).not.toHaveProperty('timeout');
    expect(result.localOnly).toBe(true);
    expect(result.items).toHaveLength(1);
  });

  it('the full search is never blocked by the budget, but counts in it', async () => {
    for (let i = 0; i < EXTERNAL_CALLS_PER_MINUTE; i += 1) recordExternalCall();
    expect(canCallExternal()).toBe(false);

    await searchFoods('frango'); // ação explícita: segue sem external=false
    expect(get.mock.calls[0][1]).toMatchObject({ params: { q: 'frango', page: 1, limit: 50 } });
    expect((get.mock.calls[0][1] as { params: Record<string, unknown> }).params).not.toHaveProperty('external');
  });

  it('the window frees up after a minute', () => {
    const start = 1_000_000;
    for (let i = 0; i < EXTERNAL_CALLS_PER_MINUTE; i += 1) recordExternalCall(start + i);
    expect(canCallExternal(start + 1000)).toBe(false);
    expect(canCallExternal(start + 61_000)).toBe(true);
  });

  it('a request already local does not use the budget', async () => {
    await searchFoods('frango', { external: false });
    expect(canCallExternal()).toBe(true);
    expect(JSON.stringify(get.mock.calls[0][1])).toContain('"external":false');
  });
});
