/**
 * Tipos de domínio "à mão", usados enquanto o backend ainda não expõe o
 * Swagger real. Quando `npm run generate:types` puder rodar contra o
 * swagger.json do NestJS (seção 120.2), os tipos gerados em `api.d.ts`
 * passam a ser a fonte de verdade — estes aqui viram apenas os tipos de
 * domínio "amigáveis" que a UI consome, mapeados a partir daqueles.
 */

// Valores conhecidos de origem do alimento. O backend pode devolver outros: o
// valor é preservado como veio (por isso o `string & {}`, que mantém o
// autocompletar dos conhecidos sem descartar os demais).
export type FoodSource = 'TBCA' | 'OPEN_FOOD_FACTS' | 'USDA' | 'MANUAL' | (string & Record<never, never>);

// Formato de normalização — seção 32 do documento
export interface FoodItem {
  id: string;
  name: string;
  // Marca do produto (alimentos industrializados / cadastro manual). Opcional.
  brand?: string | null;
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

// Um dia do histórico de desempenho (GET /v1/progress/history).
export interface DailyProgressEntry {
  date: string; // AAAA-MM-DD
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  mealCount: number;
  // Meta de calorias do dia; null quando o backend não calcula.
  targetCalories: number | null;
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

// Tipo da refeição (escolhido pelo usuário). O backend real ainda NÃO tem um
// campo próprio: o tipo viaja dentro do `name` (ver api/mealName.ts).
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface MealLog {
  id: string;
  // O backend real não devolve o dono da refeição (a lista já é do usuário).
  userId?: string;
  plannedMealId: string | null;
  // Tipo da refeição; null quando o nome vindo do backend não segue o padrão
  // conhecido (refeições antigas ou nomes livres).
  mealType: MealType | null;
  // Nome dado ao prato (opcional). Sem nome, a UI mostra o rótulo do tipo.
  name: string | null;
  photoUrl: string | null;
  consumedAt: string; // ISO 8601
  items: MealLogItem[];
}

export interface GroupSummary {
  id: string;
  name: string;
  inviteCode: string;
  // O backend real não informa a quantidade de membros.
  memberCount?: number;
  description?: string | null;
  isPrivate?: boolean;
  // Papel do usuário no grupo (ex.: dono ou membro), como vem do backend.
  role?: string;
}

// Item do feed do grupo (sem tela ainda).
export interface GroupFeedItem {
  id: string;
  groupId: string;
  userId: string;
  username: string;
  displayName: string;
  mealLogId: string | null;
  content: string | null;
  reactions: unknown;
  viewerReaction: string | null;
  createdAt: string;
}

export interface RankingEntry {
  position: number;
  userId: string;
  initials: string;
  displayName: string;
  points: number;
  // Sequência de dias do membro. Só existe no mock: o backend real não devolve.
  streak?: number;
}

// O terceiro valor cobre quem prefere não informar (campo biologicalSex da
// API). O valor enviado ao backend sai de api/sexMapping.ts.
export type BiologicalSex = 'FEMALE' | 'MALE' | 'PREFER_NOT_TO_SAY';
export type NutritionGoal =
  | 'LOSE_WEIGHT'
  | 'GAIN_MUSCLE'
  | 'GAIN_STRENGTH'
  | 'MAINTAIN'
  | 'RECOMPOSITION' // existe no backend; não é opção do Onboarding
  | 'PERFORMANCE';
export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHT'
  | 'MODERATE'
  | 'INTENSE'
  | 'VERY_INTENSE';

export interface BodyMeasurement {
  id: string;
  heightCm: number;
  weightKg: number;
  measuredAt: string;
}

export interface NutritionMetrics {
  ageYears: number;
  bmrKcalPerDay: number;
  tdeeKcalPerDay: number;
  calorieTargetKcalPerDay: number;
  calculatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  dateOfBirth: string | null;
  biologicalSex: BiologicalSex | null;
  goal: NutritionGoal | null;
  activityLevel: ActivityLevel | null;
  targetWeightKg: number | null;
  targetDate: string | null;
  dietaryRestrictions: string | null;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  currentMeasurement: BodyMeasurement | null;
  measurements: BodyMeasurement[];
  nutrition: NutritionMetrics | null;
  // Fuso do usuário (nome IANA, ex.: America/Sao_Paulo) — define o "hoje" do backend.
  timezone?: string | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  termsAccepted: boolean;
  termsAcceptedAt: string;
  createdAt: string;
  profile: {
    id: string;
    onboardingCompleted: boolean;
  };
}

// Formato de erro padronizado — seção 67
export interface ApiErrorShape {
  statusCode: number;
  error?: string;
  code?: string;
  message: string | string[];
  timestamp: string;
  path: string;
  correlationId?: string;
}
