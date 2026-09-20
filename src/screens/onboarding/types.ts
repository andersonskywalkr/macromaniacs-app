// Estado em memória do wizard de onboarding — não precisa sobreviver a um
// fechamento do app (seção do prompt: "estado local/em memória"), só
// precisa persistir entre os 6 passos enquanto o usuário navega pra frente
// e pra trás. Por isso vive como useState em OnboardingScreen, não numa
// store do zustand.
export interface OnboardingData {
  // Apelido/preferência de como chamar o usuário na UI (ex.: saudação da
  // Home). O backend atual ainda não recebe esse campo no cadastro.
  displayName: string;
  birthDate: string;
  heightCm: string;
  weightKg: string;
  // Sexo biológico (não identidade de gênero) — só as duas opções que
  // entram na fórmula de taxa metabólica basal.
  sex: BiologicalSex | null;
  goal: NutritionGoal | null;
  activityLevel: ActivityLevel | null;
  // Etapa "Últimos detalhes" — todos opcionais, formato já fechado com
  // backend/DB (peso-meta, prazo desejado, restrições alimentares).
  targetWeightKg: string;
  targetDate: string;
  dietaryRestrictions: string;
}

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  displayName: '',
  birthDate: '',
  heightCm: '',
  weightKg: '',
  sex: null,
  goal: null,
  activityLevel: null,
  targetWeightKg: '',
  targetDate: '',
  dietaryRestrictions: '',
};

// Rótulo (protótipo, em pt-BR) -> código de domínio, no mesmo estilo dos
// valores já usados em mocks/data.ts (ex.: 'LOSE_WEIGHT', 'MODERATE').
export const SEX_OPTIONS: { label: string; value: OnboardingData['sex'] }[] = [
  { label: 'Feminino', value: 'FEMALE' },
  { label: 'Masculino', value: 'MALE' },
];

export const GOAL_OPTIONS: { label: string; value: NutritionGoal }[] = [
  { label: 'Emagrecimento', value: 'LOSE_WEIGHT' },
  { label: 'Ganho de massa', value: 'GAIN_MUSCLE' },
  { label: 'Ganho de força', value: 'GAIN_STRENGTH' },
  { label: 'Manutenção', value: 'MAINTAIN' },
  { label: 'Performance', value: 'PERFORMANCE' },
];

export interface ActivityOption {
  label: string;
  value: ActivityLevel;
  description: string;
  criteria: string;
}

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    label: 'Sedentário',
    value: 'SEDENTARY',
    description: 'Pouco ou nenhum exercício',
    criteria: 'Trabalho sentado, sem rotina de treino',
  },
  {
    label: 'Leve',
    value: 'LIGHT',
    description: 'Exercício leve de 1 a 3 vezes por semana',
    criteria: 'Caminhadas, treinos leves ocasionais',
  },
  {
    label: 'Moderado',
    value: 'MODERATE',
    description: 'Exercício moderado de 3 a 5 vezes por semana',
    criteria: 'Rotina de academia/esporte constante, intensidade média',
  },
  {
    label: 'Intenso',
    value: 'INTENSE',
    description: 'Exercício intenso de 6 a 7 vezes por semana',
    criteria: 'Treino praticamente todo dia, alta intensidade',
  },
  {
    label: 'Muito intenso',
    value: 'VERY_INTENSE',
    description: 'Treino muito intenso, todos os dias, ou 2 vezes ao dia',
    criteria: 'Duplo treino diário, ou trabalho fisicamente pesado somado a treino intenso',
  },
];

export function findLabel(options: { label: string; value: string | null }[], value: string | null): string {
  return options.find((o) => o.value === value)?.label ?? '—';
}
import type {
  ActivityLevel,
  BiologicalSex,
  NutritionGoal,
} from '@/api/types/domain';
