/**
 * Tipos de domínio "à mão", usados enquanto o backend ainda não expõe o
 * Swagger real. Quando `npm run generate:types` puder rodar contra o
 * swagger.json do NestJS (seção 120.2), os tipos gerados em `api.d.ts`
 * passam a ser a fonte de verdade — estes aqui viram apenas os tipos de
 * domínio "amigáveis" que a UI consome, mapeados a partir daqueles.
 */

export type FoodSource = 'TBCA' | 'OPEN_FOOD_FACTS' | 'USDA' | 'MANUAL';

// Formato de normalização — seção 32 do documento
export interface FoodItem {
  id: string;
  name: string;
  source: FoodSource;
  externalId: string | null;
  barcode: string | null;
  nutritionPer100g: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
  };
}

export interface MacroGoal {
  goal: number;
  consumed: number;
}

// Formato do dashboard — seção 92 (referência, mesmo não sendo usado em P0)
export interface ProgressToday {
  calories: MacroGoal;
  protein: MacroGoal;
  carbohydrates: MacroGoal;
  fat: MacroGoal;
}

export interface GamificationStats {
  points: number;
  currentStreak: number;
  bestStreak: number;
}

export interface MealLogItem {
  id: string;
  foodId: string;
  foodName: string;
  amountGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MealLog {
  id: string;
  userId: string;
  plannedMealId: string | null;
  name: string;
  photoUrl: string | null;
  consumedAt: string; // ISO 8601
  items: MealLogItem[];
}

export interface GroupSummary {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
}

export interface RankingEntry {
  position: number;
  userId: string;
  initials: string;
  displayName: string;
  points: number;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  birthDate: string | null;
  heightCm: number | null;
  currentWeightKg: number | null;
  goal: string | null;
  activityLevel: string | null;
}

// Formato de erro padronizado — seção 67
export interface ApiErrorShape {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
  path: string;
}
