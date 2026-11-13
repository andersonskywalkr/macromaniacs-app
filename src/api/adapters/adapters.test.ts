import { unwrapItems, round2, toNumber } from './common';
import { buildManualFoodName, fromApiFood, toApiManualFood, type ApiFood } from './foods';
import { fromApiMeal, toApiCreateMeal, type ApiMeal } from './meals';
import {
  emptyDailyProgress,
  fromApiDailyProgress,
  fromApiGamificationSummary,
} from './progress';
import {
  buildInitials,
  fromApiFeedItem,
  fromApiGroup,
  fromApiRankingEntry,
} from './groups';

// Respostas de exemplo no formato do backend.
const backendFood: ApiFood = {
  id: '3f0c6a52-6d3a-4a53-9a1c-0a5d3f3a1b11',
  name: 'Arroz, tipo 1, cozido',
  source: 'TACO',
  externalId: '1',
  barcode: null,
  caloriesPer100g: '128.00',
  proteinPer100g: 2.5,
  carbsPer100g: '28.1',
  fatPer100g: 0.2,
  fiberPer100g: 1.6,
  servingSizeG: 100,
  retrievedAt: '2026-10-01T10:00:00.000Z',
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
};

describe('common helpers', () => {
  it('reads items from { items, meta } and from a plain list', () => {
    expect(unwrapItems({ items: [1, 2], meta: { page: 1, total: 2 } })).toEqual([1, 2]);
    expect(unwrapItems([3])).toEqual([3]);
    expect(unwrapItems(null)).toEqual([]);
    expect(unwrapItems({ items: undefined as unknown as number[] })).toEqual([]);
  });

  it('converts numeric text and rounds to 2 decimals within limits', () => {
    expect(toNumber('12.50')).toBe(12.5);
    expect(toNumber(null, 7)).toBe(7);
    expect(toNumber('abc')).toBe(0);
    expect(round2(1.005 + 0.0001)).toBe(1.01);
    expect(round2(-3)).toBe(0);
    expect(round2(20000)).toBe(9999.99);
  });
});

describe('food adapter', () => {
  it('converts a backend Food to the app FoodItem (source preserved, no brand)', () => {
    expect(fromApiFood(backendFood)).toEqual({
      id: backendFood.id,
      name: 'Arroz, tipo 1, cozido',
      brand: null,
      source: 'TACO',
      externalId: '1',
      barcode: null,
      nutritionPer100g: { calories: 128, protein: 2.5, carbohydrates: 28.1, fat: 0.2, fiber: 1.6 },
    });
  });

  it('joins the brand to the name and respects 255 characters', () => {
    expect(buildManualFoodName('Iogurte natural', 'Itambé')).toBe('Iogurte natural (Itambé)');
    expect(buildManualFoodName('  Pão  ', '')).toBe('Pão');
    const long = buildManualFoodName('x'.repeat(300), 'Marca');
    expect(long).toHaveLength(255);
    expect(long.endsWith(' (Marca)')).toBe(true);
    expect(buildManualFoodName('y'.repeat(300))).toHaveLength(255);
  });

  it('builds the flat manual-food body, rounded to 2 decimals, without brand', () => {
    const body = toApiManualFood({
      name: 'Frango à passarinho',
      brand: 'Casa',
      barcode: null,
      nutritionPer100g: { calories: 218.456, protein: 27.004, carbohydrates: 2, fat: 11.555, fiber: 0 },
    });

    expect(body).toEqual({
      name: 'Frango à passarinho (Casa)',
      barcode: null,
      caloriesPer100g: 218.46,
      proteinPer100g: 27,
      carbsPer100g: 2,
      fatPer100g: 11.56,
      fiberPer100g: 0,
    });
    expect(body).not.toHaveProperty('brand');
    expect(body).not.toHaveProperty('nutritionPer100g');
  });

  it('only sends valid barcodes (8, 12, 13 or 14 digits)', () => {
    const base = {
      name: 'X',
      nutritionPer100g: { calories: 1, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 },
    };
    expect(toApiManualFood({ ...base, barcode: '7891234567895' }).barcode).toBe('7891234567895');
    expect(toApiManualFood({ ...base, barcode: '12345678' }).barcode).toBe('12345678');
    expect(toApiManualFood({ ...base, barcode: '123456789' }).barcode).toBeNull();
  });
});

describe('meal adapter', () => {
  it('builds the create body with only the accepted fields', () => {
    const body = toApiCreateMeal({
      mealType: 'LUNCH',
      name: 'Almoço de segunda',
      consumedAt: '2026-10-22T15:00:00.000Z',
      items: [
        { foodId: 'a', amountGrams: 150.456 },
        { foodId: 'b', amountGrams: 0.001 },
      ],
    });

    expect(body).toEqual({
      name: 'Almoço - Almoço de segunda',
      consumedAt: '2026-10-22T15:00:00.000Z',
      items: [
        { foodId: 'a', amountGrams: 150.46 },
        { foodId: 'b', amountGrams: 0.01 },
      ],
    });
    expect(Object.keys(body).sort()).toEqual(['consumedAt', 'items', 'name']);
  });

  it('sends only the type when there is no name, and keeps the name within 100 characters', () => {
    expect(
      toApiCreateMeal({ mealType: 'SNACK', consumedAt: 'x', items: [] }).name,
    ).toBe('Lanche');
    expect(
      toApiCreateMeal({ mealType: 'BREAKFAST', name: 'n'.repeat(200), consumedAt: 'x', items: [] }).name,
    ).toHaveLength(100);
  });

  it('includes photoUrl only when present', () => {
    const body = toApiCreateMeal({
      mealType: 'LUNCH',
      photoUrl: 'https://x/y.jpg',
      consumedAt: 'x',
      items: [],
    });
    expect(body.photoUrl).toBe('https://x/y.jpg');
  });

  it('converts a backend Meal, decoding type and name and fixing null food fields', () => {
    const meal: ApiMeal = {
      id: 'm1',
      plannedMealId: null,
      name: 'Jantar - Sopa - de legumes',
      photoUrl: null,
      consumedAt: '2026-10-22T22:00:00.000Z',
      foodDate: '2026-10-22',
      timezone: 'America/Sao_Paulo',
      items: [
        {
          id: 'i1',
          foodId: null,
          foodName: null,
          amountGrams: '200.00',
          calories: '150.5',
          protein: 5,
          carbs: '20',
          fat: 3,
          fiber: 1,
          inputMethod: 'MANUAL',
        },
      ],
      totals: { calories: 150.5, protein: 5, carbs: 20, fat: 3, fiber: 1 },
    };

    expect(fromApiMeal(meal)).toEqual({
      id: 'm1',
      plannedMealId: null,
      mealType: 'DINNER',
      name: 'Sopa - de legumes',
      photoUrl: null,
      consumedAt: '2026-10-22T22:00:00.000Z',
      items: [
        {
          id: 'i1',
          foodId: '',
          foodName: 'Alimento',
          amountGrams: 200,
          calories: 150.5,
          protein: 5,
          carbs: 20,
          fat: 3,
          fiber: 1,
        },
      ],
    });
    expect(fromApiMeal(meal)).not.toHaveProperty('userId');
  });

  it('treats an old plain name as a free name without type', () => {
    const converted = fromApiMeal({
      id: 'm2',
      name: 'Sobras de ontem',
      consumedAt: 'x',
      items: [],
    });
    expect(converted).toMatchObject({ mealType: null, name: 'Sobras de ontem' });
  });
});

describe('progress and gamification adapters', () => {
  const raw = {
    date: '2026-10-22',
    timezone: 'America/Sao_Paulo',
    calories: '1200.5',
    protein: 80,
    carbs: '150',
    fat: 40,
    fiber: 20,
    mealCount: 3,
    targetCalories: 2400,
    calorieProgressPercent: 50,
    updatedAt: '2026-10-22T20:00:00.000Z',
  };

  it('converts to ProgressToday, using the 50/25/25 split for macro goals', () => {
    expect(fromApiDailyProgress(raw)).toEqual({
      calories: { goal: 2400, consumed: 1200.5 },
      protein: { goal: 150, consumed: 80 },
      carbohydrates: { goal: 300, consumed: 150 },
      fat: { goal: 67, consumed: 40 },
    });
  });

  it('uses the app fallback goal when targetCalories is null', () => {
    const progress = fromApiDailyProgress({ ...raw, targetCalories: null }, 2000);
    expect(progress.calories).toEqual({ goal: 2000, consumed: 1200.5 });
    expect(progress.carbohydrates.goal).toBe(250);
  });

  it('keeps zero goals when there is neither backend nor fallback goal', () => {
    const progress = fromApiDailyProgress({ ...raw, targetCalories: null });
    expect(progress.calories.goal).toBe(0);
    expect(progress.protein.goal).toBe(0);
  });

  it('treats an empty day as zero consumption', () => {
    expect(emptyDailyProgress(2000)).toEqual({
      calories: { goal: 2000, consumed: 0 },
      protein: { goal: 125, consumed: 0 },
      carbohydrates: { goal: 250, consumed: 0 },
      fat: { goal: 56, consumed: 0 },
    });
  });

  it('maps totalPoints to points', () => {
    expect(
      fromApiGamificationSummary({
        currentStreak: 4,
        bestStreak: 9,
        totalPoints: 1250,
        lastActivityDate: '2026-10-22',
        timezone: 'America/Sao_Paulo',
        scoringVersion: 1,
      }),
    ).toEqual({ points: 1250, currentStreak: 4, bestStreak: 9 });
  });
});

describe('group adapters', () => {
  it('converts a group without inventing memberCount', () => {
    const group = fromApiGroup({
      id: 'g1',
      name: 'Los Maniacs',
      description: null,
      isPrivate: true,
      role: 'OWNER',
      inviteCode: 'ABCD1234',
      createdAt: '2026-10-01T00:00:00.000Z',
    });
    expect(group).toEqual({
      id: 'g1',
      name: 'Los Maniacs',
      inviteCode: 'ABCD1234',
      description: null,
      isPrivate: true,
      role: 'OWNER',
    });
    expect(group).not.toHaveProperty('memberCount');
  });

  it('builds the initials from the display name, with username fallback', () => {
    expect(buildInitials('Maria Pereira', 'maria')).toBe('MP');
    expect(buildInitials('joão pedro silva', 'jp')).toBe('JP');
    expect(buildInitials('Anderson', 'anderson')).toBe('AN');
    expect(buildInitials('', 'carlos_s')).toBe('CA');
    expect(buildInitials(null, null)).toBe('?');
  });

  it('converts the ranking entries', () => {
    expect(
      fromApiRankingEntry({ position: 1, userId: 'u1', username: 'maria', displayName: 'Maria Pereira', points: '980' }),
    ).toEqual({ position: 1, userId: 'u1', initials: 'MP', displayName: 'Maria Pereira', points: 980 });
    expect(
      fromApiRankingEntry({ position: 2, userId: 'u2', username: 'joao', displayName: null, points: 10 }),
    ).toMatchObject({ initials: 'JO', displayName: 'joao' });
  });

  it('converts a feed item', () => {
    expect(
      fromApiFeedItem({
        id: 'f1',
        groupId: 'g1',
        userId: 'u1',
        username: 'maria',
        displayName: 'Maria',
        createdAt: '2026-10-22T10:00:00.000Z',
      }),
    ).toMatchObject({ mealLogId: null, content: null, viewerReaction: null, displayName: 'Maria' });
  });
});
