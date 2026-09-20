import type { OnboardingData } from '@/screens/onboarding/types';
import type { UpdateMyProfileRequest } from '@/api/users';

export function toIsoDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function ageOn(dateOfBirth: string, today: Date): number {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  let age = today.getUTCFullYear() - year;
  if (
    today.getUTCMonth() + 1 < month ||
    (today.getUTCMonth() + 1 === month && today.getUTCDate() < day)
  ) {
    age -= 1;
  }
  return age;
}

export function validateOnboardingStep(
  step: number,
  data: OnboardingData,
  today = new Date(),
): string | null {
  if (step === 0) {
    if (
      !data.displayName.trim() ||
      !data.birthDate.trim() ||
      !data.heightCm.trim() ||
      !data.weightKg.trim()
    ) {
      return 'Preencha todos os campos para continuar.';
    }
    if (data.displayName.trim().length > 80) {
      return 'O nome deve ter no máximo 80 caracteres.';
    }
    const birthDate = toIsoDate(data.birthDate);
    if (!birthDate) return 'Informe uma data de nascimento válida.';
    const age = ageOn(birthDate, today);
    if (age < 18 || age > 120) {
      return 'A data de nascimento deve corresponder a uma idade entre 18 e 120 anos.';
    }
    const height = Number(data.heightCm);
    if (height < 80 || height > 250) {
      return 'Informe uma altura entre 80 e 250 cm.';
    }
    const weight = Number(data.weightKg.replace(',', '.'));
    if (weight < 25 || weight > 400) {
      return 'Informe um peso entre 25 e 400 kg.';
    }
  }

  if (step === 1 && !data.sex) return 'Selecione uma opção para continuar.';
  if (step === 2 && !data.goal) return 'Selecione uma opção para continuar.';
  if (step === 3 && !data.activityLevel) {
    return 'Selecione uma opção para continuar.';
  }

  if (step === 4) {
    const hasWeight = Boolean(data.targetWeightKg.trim());
    const hasDate = Boolean(data.targetDate.trim());
    if (hasWeight !== hasDate) {
      return 'Informe o peso-meta e a data-meta juntos, ou deixe ambos vazios.';
    }
    if (hasWeight) {
      const targetWeight = Number(data.targetWeightKg.replace(',', '.'));
      if (targetWeight < 25 || targetWeight > 400) {
        return 'Informe um peso-meta entre 25 e 400 kg.';
      }
      const targetDate = toIsoDate(data.targetDate);
      if (!targetDate) return 'Informe uma data-meta válida.';
      const targetTime = new Date(`${targetDate}T00:00:00.000Z`).getTime();
      const todayTime = Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate(),
      );
      if (targetTime <= todayTime) return 'A data-meta deve estar no futuro.';
    }
    if (data.dietaryRestrictions.trim().length > 1000) {
      return 'As restrições devem ter no máximo 1000 caracteres.';
    }
  }

  return null;
}

export function validateOnboarding(
  data: OnboardingData,
  today = new Date(),
): string | null {
  for (let step = 0; step <= 4; step += 1) {
    const error = validateOnboardingStep(step, data, today);
    if (error) return error;
  }
  return null;
}

export function buildOnboardingRequest(
  data: OnboardingData,
  today = new Date(),
): UpdateMyProfileRequest {
  const validationError = validateOnboarding(data, today);
  if (validationError) throw new Error(validationError);

  return {
    displayName: data.displayName.trim(),
    dateOfBirth: toIsoDate(data.birthDate)!,
    heightCm: Number(data.heightCm),
    currentWeightKg: Number(data.weightKg.replace(',', '.')),
    biologicalSex: data.sex,
    goal: data.goal,
    activityLevel: data.activityLevel,
    targetWeightKg: data.targetWeightKg.trim()
      ? Number(data.targetWeightKg.replace(',', '.'))
      : null,
    targetDate: data.targetDate.trim() ? toIsoDate(data.targetDate) : null,
    dietaryRestrictions: data.dietaryRestrictions.trim() || null,
  };
}
