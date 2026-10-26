import type { UserProfile } from '@/api/types/domain';
import type { OnboardingData } from '@/screens/onboarding/types';
import { INITIAL_ONBOARDING_DATA } from '@/screens/onboarding/types';

// O Editar perfil usa o mesmo formulário (e a mesma validação) do Onboarding:
// aqui só convertemos o perfil salvo para o formato de texto do formulário.

// "2026-03-01" (ou ISO completo) -> "01/03/2026"
export function isoToBrDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

// 82.5 -> "82,5" (o formulário aceita vírgula ou ponto)
function numberToText(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value).replace('.', ',');
}

export function profileToFormData(profile: UserProfile): OnboardingData {
  const measurement = profile.currentMeasurement;
  return {
    ...INITIAL_ONBOARDING_DATA,
    displayName: profile.displayName ?? '',
    birthDate: isoToBrDate(profile.dateOfBirth),
    heightCm: measurement ? String(measurement.heightCm) : '',
    weightKg: numberToText(measurement?.weightKg),
    sex: profile.biologicalSex,
    goal: profile.goal,
    activityLevel: profile.activityLevel,
    targetWeightKg: numberToText(profile.targetWeightKg),
    targetDate: isoToBrDate(profile.targetDate),
    dietaryRestrictions: profile.dietaryRestrictions ?? '',
  };
}

// Há alteração se algum campo é diferente do que veio do perfil (espaços nas
// pontas não contam).
export function hasFormChanges(initial: OnboardingData, current: OnboardingData): boolean {
  return (Object.keys(initial) as (keyof OnboardingData)[]).some((key) => {
    const a = initial[key];
    const b = current[key];
    return typeof a === 'string' && typeof b === 'string' ? a.trim() !== b.trim() : a !== b;
  });
}
