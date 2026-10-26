import type {
  ProgressToday,
  GamificationStats,
  FoodItem,
  MealLog,
  RankingEntry,
  UserProfile,
  GroupSummary,
} from '@/api/types/domain';

// Metas do dia no mock (calorias iguais à meta do mockUserProfile). O consumo
// COMEÇA EM 0: quem soma as refeições salvas na sessão é o mealStore do mock
// (ver mocks/mealStore.ts e api/progress.ts).
export const mockProgressToday: ProgressToday = {
  calories: { goal: 2511, consumed: 0 },
  protein: { goal: 160, consumed: 0 },
  carbohydrates: { goal: 280, consumed: 0 },
  fat: { goal: 80, consumed: 0 },
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

// ATENÇÃO: valores de TESTE, aproximados de tabelas brasileiras (TACO) só
// para exercitar o fluxo no mock. NÃO substituem a tabela validada pelo grupo
// de Nutrição — não usar como fonte de dados reais.
export const mockFoods: FoodItem[] = [
  {
    id: 'food-1',
    name: 'Arroz branco cozido',
    source: 'TBCA',
    externalId: 'tbca-001',
    barcode: null,
    nutritionPer100g: { calories: 128, protein: 2.5, carbohydrates: 28.1, fat: 0.2, fiber: 1.6 },
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
    name: 'Peito de frango grelhado',
    source: 'TBCA',
    externalId: 'tbca-003',
    barcode: null,
    nutritionPer100g: { calories: 159, protein: 32, carbohydrates: 0, fat: 3.6, fiber: 0 },
  },
  {
    id: 'food-4',
    name: 'Frango grelhado',
    source: 'TBCA',
    externalId: 'tbca-004',
    barcode: null,
    nutritionPer100g: { calories: 165, protein: 31, carbohydrates: 0, fat: 3.6, fiber: 0 },
  },
  {
    id: 'food-5',
    name: 'Frango frito',
    source: 'TBCA',
    externalId: 'tbca-005',
    barcode: null,
    nutritionPer100g: { calories: 246, protein: 28, carbohydrates: 6.5, fat: 12, fiber: 0.3 },
  },
  {
    id: 'food-6',
    name: 'Ovo de galinha cozido',
    source: 'TBCA',
    externalId: 'tbca-006',
    barcode: null,
    nutritionPer100g: { calories: 146, protein: 13.3, carbohydrates: 0.6, fat: 9.5, fiber: 0 },
  },
  {
    id: 'food-7',
    name: 'Banana prata',
    source: 'TBCA',
    externalId: 'tbca-007',
    barcode: null,
    nutritionPer100g: { calories: 98, protein: 1.3, carbohydrates: 24, fat: 0.1, fiber: 2 },
  },
  {
    id: 'food-8',
    name: 'Batata doce cozida',
    source: 'TBCA',
    externalId: 'tbca-008',
    barcode: null,
    nutritionPer100g: { calories: 77, protein: 0.6, carbohydrates: 18.4, fat: 0.1, fiber: 2.2 },
  },
  {
    id: 'food-9',
    name: 'Aveia em flocos',
    source: 'TBCA',
    externalId: 'tbca-009',
    barcode: null,
    nutritionPer100g: { calories: 394, protein: 13.9, carbohydrates: 66.6, fat: 8.5, fiber: 9.1 },
  },
  {
    id: 'food-10',
    name: 'Iogurte natural integral',
    brand: 'Itambé',
    source: 'OPEN_FOOD_FACTS',
    externalId: 'off-010',
    barcode: '7891234567895',
    nutritionPer100g: { calories: 64, protein: 3.5, carbohydrates: 4.7, fat: 3.3, fiber: 0 },
  },
  {
    id: 'food-11',
    name: 'Pão francês',
    source: 'TBCA',
    externalId: 'tbca-011',
    barcode: null,
    nutritionPer100g: { calories: 300, protein: 8, carbohydrates: 58.6, fat: 3.1, fiber: 2.3 },
  },
  {
    id: 'food-12',
    name: 'Whey protein concentrado',
    brand: 'Growth',
    source: 'OPEN_FOOD_FACTS',
    externalId: 'off-012',
    barcode: '7890000000011',
    nutritionPer100g: { calories: 400, protein: 78, carbohydrates: 8, fat: 6, fiber: 0 },
  },
  {
    id: 'food-13',
    name: 'Patinho grelhado',
    source: 'TBCA',
    externalId: 'tbca-013',
    barcode: null,
    nutritionPer100g: { calories: 219, protein: 35.9, carbohydrates: 0, fat: 7.3, fiber: 0 },
  },
  {
    id: 'food-14',
    name: 'Maçã com casca',
    source: 'TBCA',
    externalId: 'tbca-014',
    barcode: null,
    nutritionPer100g: { calories: 59, protein: 0.3, carbohydrates: 14.8, fat: 0.2, fiber: 1.3 },
  },
  {
    id: 'food-15',
    name: 'Leite integral',
    source: 'TBCA',
    externalId: 'tbca-015',
    barcode: null,
    nutritionPer100g: { calories: 61, protein: 2.9, carbohydrates: 4.3, fat: 3.2, fiber: 0 },
  },
  {
    id: 'food-16',
    name: 'Queijo minas frescal',
    source: 'TBCA',
    externalId: 'tbca-016',
    barcode: null,
    nutritionPer100g: { calories: 264, protein: 17.4, carbohydrates: 3.2, fat: 20.2, fiber: 0 },
  },
  {
    id: 'food-17',
    name: 'Mandioca cozida',
    source: 'TBCA',
    externalId: 'tbca-017',
    barcode: null,
    nutritionPer100g: { calories: 125, protein: 0.6, carbohydrates: 30.1, fat: 0.3, fiber: 1.9 },
  },
  {
    id: 'food-18',
    name: 'Macarrão cozido',
    source: 'TBCA',
    externalId: 'tbca-018',
    barcode: null,
    nutritionPer100g: { calories: 102, protein: 3.4, carbohydrates: 19.9, fat: 0.5, fiber: 1.1 },
  },
  {
    id: 'food-19',
    name: 'Azeite de oliva',
    source: 'TBCA',
    externalId: 'tbca-019',
    barcode: null,
    nutritionPer100g: { calories: 884, protein: 0, carbohydrates: 0, fat: 100, fiber: 0 },
  },
  {
    id: 'food-20',
    name: 'Pasta de amendoim',
    source: 'TBCA',
    externalId: 'tbca-020',
    barcode: null,
    nutritionPer100g: { calories: 588, protein: 25, carbohydrates: 20, fat: 50, fiber: 6 },
  },
  {
    id: 'food-21',
    name: 'Tapioca (goma hidratada)',
    source: 'TBCA',
    externalId: 'tbca-021',
    barcode: null,
    nutritionPer100g: { calories: 130, protein: 0.1, carbohydrates: 32, fat: 0, fiber: 0 },
  },
  {
    id: 'food-22',
    name: 'Atum em lata ao natural',
    source: 'TBCA',
    externalId: 'tbca-022',
    barcode: null,
    nutritionPer100g: { calories: 116, protein: 26, carbohydrates: 0, fat: 1, fiber: 0 },
  },
];

export const mockMealLogs: MealLog[] = [
  {
    id: 'meal-1',
    userId: 'user-1',
    plannedMealId: null,
    mealType: 'LUNCH',
    name: null,
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
