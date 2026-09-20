import type {
  ProgressToday,
  GamificationStats,
  FoodItem,
  MealLog,
  RankingEntry,
  UserProfile,
  GroupSummary,
} from '@/api/types/domain';

// Valores baseados no que já apareceu na tela "Home Minimalista" do protótipo
// (2200 kcal de meta, carbo 160/280, proteína 100/160, gordura 64/80).
export const mockProgressToday: ProgressToday = {
  calories: { goal: 2200, consumed: 1450 },
  protein: { goal: 160, consumed: 100 },
  carbohydrates: { goal: 280, consumed: 160 },
  fat: { goal: 80, consumed: 64 },
};

export const mockGamificationStats: GamificationStats = {
  points: 420,
  currentStreak: 5,
  bestStreak: 12,
};

export const mockUserProfile: UserProfile = {
  id: 'user-1',
  email: 'anderson@example.com',
  username: 'anderson',
  displayName: 'Anderson',
  dateOfBirth: '1998-04-12',
  biologicalSex: 'MALE',
  goal: 'LOSE_WEIGHT',
  activityLevel: 'MODERATE',
  targetWeightKg: 75,
  targetDate: '2027-03-01',
  dietaryRestrictions: null,
  onboardingCompleted: true,
  onboardingCompletedAt: new Date(0).toISOString(),
  currentMeasurement: {
    id: 'measurement-1',
    heightCm: 178,
    weightKg: 82,
    measuredAt: new Date(0).toISOString(),
  },
  measurements: [
    {
      id: 'measurement-1',
      heightCm: 178,
      weightKg: 82,
      measuredAt: new Date(0).toISOString(),
    },
  ],
  nutrition: {
    ageYears: 28,
    bmrKcalPerDay: 1800,
    tdeeKcalPerDay: 2790,
    calorieTargetKcalPerDay: 2511,
    calculatedAt: new Date(0).toISOString(),
  },
};

export const mockFoods: FoodItem[] = [
  {
    id: 'food-1',
    name: 'Arroz branco cozido',
    source: 'TBCA',
    externalId: 'tbca-001',
    barcode: null,
    nutritionPer100g: { calories: 128, protein: 2.5, carbohydrates: 28, fat: 0.2, fiber: 1.6 },
  },
  {
    id: 'food-2',
    name: 'Feijão carioca cozido',
    source: 'TBCA',
    externalId: 'tbca-002',
    barcode: null,
    nutritionPer100g: { calories: 76, protein: 4.8, carbohydrates: 13.6, fat: 0.5, fiber: 8.5 },
  },
  {
    id: 'food-3',
    name: 'Frango peito grelhado',
    source: 'TBCA',
    externalId: 'tbca-003',
    barcode: null,
    nutritionPer100g: { calories: 159, protein: 32, carbohydrates: 0, fat: 3.6, fiber: 0 },
  },
];

export const mockMealLogs: MealLog[] = [
  {
    id: 'meal-1',
    userId: 'user-1',
    plannedMealId: null,
    name: 'Almoço',
    photoUrl: null,
    consumedAt: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        foodId: 'food-1',
        foodName: 'Arroz branco cozido',
        amountGrams: 100,
        calories: 128,
        protein: 2.5,
        carbs: 28,
        fat: 0.2,
        fiber: 1.6,
      },
    ],
  },
];

// Baseado na tela "Ranking do grupo Los Maniacs" do protótipo HTML
export const mockRanking: RankingEntry[] = [
  { position: 1, userId: 'user-2', initials: 'MP', displayName: 'Maria P.', points: 980 },
  { position: 2, userId: 'user-1', initials: 'AN', displayName: 'Anderson', points: 420 },
  { position: 3, userId: 'user-3', initials: 'JS', displayName: 'João S.', points: 310 },
];

export const mockGroups: GroupSummary[] = [
  { id: 'group-1', name: 'Los Maniacs', inviteCode: 'LOSMAN2026', memberCount: 8 },
];
