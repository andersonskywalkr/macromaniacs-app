import { httpClient } from './client';
import { ApiError } from './ApiError';
import { createManualFood, getFoodByBarcode, searchFoods } from './foods';
import { createMeal, getMealsByDateRange, getMealsToday } from './meals';
import { getProgressHistory, getProgressToday } from './progress';
import { getGamificationStats } from './gamification';
import { getGroupFeed, getGroupRanking, getMyGroups, joinGroup } from './groups';
import { getMyProfile, updateMyProfile } from './users';

// Modo REAL (USE_MOCK=false): confere rotas (com /v1), parâmetros, corpos
// enviados e a conversão das respostas no formato do backend.
jest.mock('./config', () => ({
  MOCK_LATENCY_MS: 0,
  USE_MOCK: false,
  USE_AUTH_MOCK: false,
}));
jest.mock('./client', () => ({
  httpClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

const get = jest.mocked(httpClient.get);
const post = jest.mocked(httpClient.post);
const patch = jest.mocked(httpClient.patch);

const backendFood = {
  id: '3f0c6a52-6d3a-4a53-9a1c-0a5d3f3a1b11',
  name: 'Arroz, tipo 1, cozido',
  source: 'TACO',
  externalId: '1',
  barcode: null,
  caloriesPer100g: 128,
  proteinPer100g: 2.5,
  carbsPer100g: 28.1,
  fatPer100g: 0.2,
  fiberPer100g: 1.6,
  servingSizeG: 100,
};

describe('foods (real mode)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('searches on GET /v1/foods?q= and reads items from { items, meta }', async () => {
    get.mockResolvedValue({
      data: { items: [backendFood], meta: { page: 1, limit: 20, total: 1 } },
    });

    const foods = await searchFoods('  arroz ');

    expect(get).toHaveBeenCalledWith('/v1/foods', { params: { q: 'arroz', limit: 20 } });
    expect(foods).toHaveLength(1);
    expect(foods[0]).toMatchObject({
      name: 'Arroz, tipo 1, cozido',
      source: 'TACO',
      brand: null,
      nutritionPer100g: { calories: 128, carbohydrates: 28.1 },
    });
  });

  it('turns a 404 on barcode into null and converts a found food', async () => {
    get.mockResolvedValueOnce({ data: backendFood });
    expect((await getFoodByBarcode('7891234567895'))?.id).toBe(backendFood.id);
    expect(get).toHaveBeenCalledWith('/v1/foods/barcode/7891234567895');

    get.mockRejectedValueOnce(new ApiError({ statusCode: 404, message: 'x', timestamp: '', path: '' }));
    expect(await getFoodByBarcode('00000000')).toBeNull();
  });

  it('posts the manual food as flat fields on /v1/foods/manual', async () => {
    post.mockResolvedValue({ data: { ...backendFood, source: 'MANUAL', name: 'Pão (Casa)' } });

    const created = await createManualFood({
      name: 'Pão',
      brand: 'Casa',
      barcode: null,
      nutritionPer100g: { calories: 250.123, protein: 8, carbohydrates: 50, fat: 3, fiber: 2 },
    });

    expect(post).toHaveBeenCalledWith('/v1/foods/manual', {
      name: 'Pão (Casa)',
      barcode: null,
      caloriesPer100g: 250.12,
      proteinPer100g: 8,
      carbsPer100g: 50,
      fatPer100g: 3,
      fiberPer100g: 2,
    });
    expect(created.source).toBe('MANUAL');
  });
});

describe('meals (real mode)', () => {
  beforeEach(() => jest.clearAllMocks());

  const backendMeal = {
    id: 'm1',
    plannedMealId: null,
    name: 'Almoço - Almoço de segunda',
    photoUrl: null,
    consumedAt: '2026-10-22T15:00:00.000Z',
    foodDate: '2026-10-22',
    timezone: 'America/Sao_Paulo',
    items: [
      {
        id: 'i1',
        foodId: null,
        foodName: null,
        amountGrams: 150,
        calories: 192,
        protein: 3.75,
        carbs: 42,
        fat: 0.3,
        fiber: 2.4,
        inputMethod: 'MANUAL',
      },
    ],
    totals: { calories: 192, protein: 3.75, carbs: 42, fat: 0.3, fiber: 2.4 },
  };

  it('creates the meal on POST /v1/meals/manual without extra fields', async () => {
    post.mockResolvedValue({ data: backendMeal });

    const meal = await createMeal({
      mealType: 'LUNCH',
      name: 'Almoço de segunda',
      consumedAt: '2026-10-22T15:00:00.000Z',
      items: [{ foodId: 'f1', amountGrams: 150 }],
    });

    expect(post).toHaveBeenCalledWith('/v1/meals/manual', {
      name: 'Almoço - Almoço de segunda',
      consumedAt: '2026-10-22T15:00:00.000Z',
      items: [{ foodId: 'f1', amountGrams: 150 }],
    });
    expect(meal).toMatchObject({ id: 'm1', mealType: 'LUNCH', name: 'Almoço de segunda' });
    expect(meal.items[0]).toMatchObject({ foodId: '', foodName: 'Alimento', calories: 192 });
  });

  it('does not send plannedMealId even if an old queued entry has it', async () => {
    post.mockResolvedValue({ data: backendMeal });

    await createMeal({
      mealType: 'LUNCH',
      consumedAt: 'x',
      items: [{ foodId: 'f1', amountGrams: 1 }],
      // entrada antiga da fila offline
      ...({ plannedMealId: 'abc' } as object),
    });

    expect(post.mock.calls[0][1]).not.toHaveProperty('plannedMealId');
  });

  it("lists today's meals on GET /v1/meals?from=HOJE&to=HOJE in the user timezone", async () => {
    get.mockResolvedValue({ data: { items: [backendMeal], meta: {} } });
    jest.useFakeTimers().setSystemTime(new Date('2026-10-23T02:30:00.000Z')); // 22/10 23:30 em São Paulo

    try {
      const meals = await getMealsToday('America/Sao_Paulo');
      expect(get).toHaveBeenCalledWith('/v1/meals', {
        params: { from: '2026-10-22', to: '2026-10-22', limit: 50 },
      });
      expect(meals).toHaveLength(1);

      await getMealsToday('UTC');
      expect(get).toHaveBeenLastCalledWith('/v1/meals', {
        params: { from: '2026-10-23', to: '2026-10-23', limit: 50 },
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('uses the same route for a date range', async () => {
    get.mockResolvedValue({ data: { items: [] } });
    await getMealsByDateRange('2026-10-01', '2026-10-07');
    expect(get).toHaveBeenCalledWith('/v1/meals', {
      params: { from: '2026-10-01', to: '2026-10-07', limit: 50 },
    });
  });
});

describe('progress and gamification (real mode)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads GET /v1/progress/daily?date= and converts it', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-22T15:00:00.000Z'));
    get.mockResolvedValue({
      data: { calories: 800, protein: 50, carbs: 90, fat: 20, fiber: 5, mealCount: 2, targetCalories: 2000 },
    });

    try {
      const progress = await getProgressToday('America/Sao_Paulo');
      expect(get).toHaveBeenCalledWith('/v1/progress/daily', { params: { date: '2026-10-22' } });
      expect(progress.calories).toEqual({ goal: 2000, consumed: 800 });
      expect(progress.carbohydrates).toEqual({ goal: 250, consumed: 90 });
    } finally {
      jest.useRealTimers();
    }
  });

  it('uses the app fallback goal when the backend sends targetCalories null', async () => {
    get.mockResolvedValue({
      data: { calories: 0, protein: 0, carbs: 0, fat: 0, targetCalories: null },
    });
    const progress = await getProgressToday('America/Sao_Paulo', 1800);
    expect(progress.calories.goal).toBe(1800);
  });

  it('treats a 404 for an empty day as zero consumption', async () => {
    get.mockRejectedValue(new ApiError({ statusCode: 404, message: 'x', timestamp: '', path: '' }));
    const progress = await getProgressToday('America/Sao_Paulo', 2000);
    expect(progress.calories).toEqual({ goal: 2000, consumed: 0 });
    expect(progress.protein.consumed).toBe(0);
  });

  it('rethrows other errors', async () => {
    get.mockRejectedValue(new ApiError({ statusCode: 500, message: 'x', timestamp: '', path: '' }));
    await expect(getProgressToday('America/Sao_Paulo')).rejects.toBeInstanceOf(ApiError);
  });

  it('reads GET /v1/gamification/summary and maps totalPoints to points', async () => {
    get.mockResolvedValue({
      data: {
        currentStreak: 3,
        bestStreak: 8,
        totalPoints: 640,
        lastActivityDate: '2026-10-22',
        timezone: 'America/Sao_Paulo',
        scoringVersion: 1,
      },
    });
    expect(await getGamificationStats()).toEqual({ points: 640, currentStreak: 3, bestStreak: 8 });
    expect(get).toHaveBeenCalledWith('/v1/gamification/summary');
  });
});

describe('groups (real mode)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads the simple group list and the ranking with initials', async () => {
    get.mockResolvedValueOnce({
      data: [
        { id: 'g1', name: 'Los Maniacs', description: null, isPrivate: false, role: 'MEMBER', inviteCode: 'ABCD1234', createdAt: 'x' },
      ],
    });
    expect(await getMyGroups()).toEqual([
      { id: 'g1', name: 'Los Maniacs', inviteCode: 'ABCD1234', description: null, isPrivate: false, role: 'MEMBER' },
    ]);
    expect(get).toHaveBeenCalledWith('/v1/groups');

    get.mockResolvedValueOnce({
      data: [{ position: 1, userId: 'u1', username: 'maria', displayName: 'Maria Pereira', points: 900 }],
    });
    expect((await getGroupRanking('g1'))[0]).toMatchObject({ initials: 'MP', points: 900 });
    expect(get).toHaveBeenLastCalledWith('/v1/groups/g1/ranking');
  });

  it('joins with the code in capital letters and reads the feed', async () => {
    post.mockResolvedValue({ data: { id: 'g1', name: 'G', inviteCode: 'ABCD1234' } });
    await joinGroup(' abcd1234 ');
    expect(post).toHaveBeenCalledWith('/v1/groups/join', { inviteCode: 'ABCD1234' });

    get.mockResolvedValue({
      data: {
        items: [
          { id: 'f1', groupId: 'g1', userId: 'u1', username: 'maria', displayName: 'Maria', mealLogId: null, content: 'Oi', reactions: {}, viewerReaction: null, createdAt: 'x' },
        ],
        meta: {},
      },
    });
    const feed = await getGroupFeed('g1');
    expect(get).toHaveBeenCalledWith('/v1/groups/g1/feed', { params: { limit: 50 } });
    expect(feed[0]).toMatchObject({ content: 'Oi', displayName: 'Maria' });
  });
});

describe('profile (real mode): sex and timezone', () => {
  beforeEach(() => jest.clearAllMocks());

  const profile = {
    id: 'u',
    email: 'a@b.c',
    username: 'anderson',
    displayName: 'Anderson',
    dateOfBirth: '1998-04-12',
    biologicalSex: 'NOT_INFORMED',
    goal: 'RECOMPOSITION',
    activityLevel: 'MODERATE',
    targetWeightKg: null,
    targetDate: null,
    dietaryRestrictions: null,
    onboardingCompleted: true,
    onboardingCompletedAt: null,
    currentMeasurement: null,
    measurements: [],
    nutrition: null,
    timezone: 'America/Sao_Paulo',
  };

  it('converts NOT_INFORMED from the backend to PREFER_NOT_TO_SAY', async () => {
    get.mockResolvedValue({ data: profile });
    const loaded = await getMyProfile();
    expect(loaded.biologicalSex).toBe('PREFER_NOT_TO_SAY');
    expect(loaded.nutrition).toBeNull();
    expect(loaded.timezone).toBe('America/Sao_Paulo');
    expect(loaded.goal).toBe('RECOMPOSITION');
  });

  it('sends the timezone and the mapped sex on PATCH /v1/users/me', async () => {
    patch.mockResolvedValue({ data: profile });
    await updateMyProfile({ biologicalSex: 'NOT_INFORMED', timezone: 'America/Sao_Paulo' });
    expect(patch).toHaveBeenCalledWith('/v1/users/me', {
      biologicalSex: 'NOT_INFORMED',
      timezone: 'America/Sao_Paulo',
    });
  });
});

describe('progress history (real mode)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads GET /v1/progress/history with limit 100 and converts each day', async () => {
    get.mockResolvedValue({
      data: {
        items: [
          {
            date: '2026-10-21',
            timezone: 'America/Sao_Paulo',
            calories: '1900.5',
            protein: 110,
            carbs: '230',
            fat: 60,
            fiber: 22,
            mealCount: 3,
            targetCalories: 2000,
            calorieProgressPercent: 95,
            updatedAt: '2026-10-21T23:00:00.000Z',
          },
          {
            date: '2026-10-22',
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            mealCount: 0,
            targetCalories: null,
            calorieProgressPercent: null,
          },
        ],
        meta: { page: 1, limit: 100, total: 2 },
      },
    });

    const days = await getProgressHistory('2026-10-16', '2026-10-22', 'America/Sao_Paulo', 1800);

    expect(get).toHaveBeenCalledWith('/v1/progress/history', {
      params: { from: '2026-10-16', to: '2026-10-22', limit: 100 },
    });
    expect(days[0]).toEqual({
      date: '2026-10-21',
      calories: 1900.5,
      protein: 110,
      carbohydrates: 230,
      fat: 60,
      fiber: 22,
      mealCount: 3,
      targetCalories: 2000,
    });
    // meta nula usa a meta do perfil (fallback)
    expect(days[1].targetCalories).toBe(1800);
  });
});
