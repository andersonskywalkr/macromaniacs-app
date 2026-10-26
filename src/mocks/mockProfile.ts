import type { UserProfile } from '@/api/types/domain';
import type { UpdateMyProfileRequest } from '@/api/users';
import { fromApiSex } from '@/api/sexMapping';
import { calculateNutrition } from '@/utils/energy';
import { mockUserProfile } from './data';

// Perfil do usuário no modo mock: em memória, muda quando o perfil é editado
// e recalcula TMB/TDEE/meta a partir dos dados (utils/energy.ts). Some ao
// reiniciar o app.

function withNutrition(profile: UserProfile): UserProfile {
  const measurement = profile.currentMeasurement;
  return {
    ...profile,
    nutrition: calculateNutrition({
      dateOfBirth: profile.dateOfBirth,
      sex: profile.biologicalSex,
      heightCm: measurement?.heightCm ?? null,
      weightKg: measurement?.weightKg ?? null,
      activityLevel: profile.activityLevel,
      goal: profile.goal,
    }),
  };
}

let profile: UserProfile = withNutrition(mockUserProfile);
let measurementCounter = profile.measurements.length;

export function getMockProfile(): UserProfile {
  return profile;
}

export function resetMockProfile(): void {
  profile = withNutrition(mockUserProfile);
  measurementCounter = profile.measurements.length;
}

export function updateMockProfile(patch: UpdateMyProfileRequest): UserProfile {
  const next: UserProfile = { ...profile };

  if (patch.displayName !== undefined) next.displayName = patch.displayName;
  if (patch.username !== undefined) next.username = patch.username;
  if (patch.dateOfBirth !== undefined) next.dateOfBirth = patch.dateOfBirth;
  if (patch.biologicalSex !== undefined) next.biologicalSex = fromApiSex(patch.biologicalSex);
  if (patch.goal !== undefined) next.goal = patch.goal;
  if (patch.activityLevel !== undefined) next.activityLevel = patch.activityLevel;
  if (patch.targetWeightKg !== undefined) next.targetWeightKg = patch.targetWeightKg;
  if (patch.targetDate !== undefined) next.targetDate = patch.targetDate;
  if (patch.dietaryRestrictions !== undefined) next.dietaryRestrictions = patch.dietaryRestrictions;

  if (patch.heightCm !== undefined || patch.currentWeightKg !== undefined) {
    measurementCounter += 1;
    const measurement = {
      id: `measurement-${measurementCounter}`,
      heightCm: patch.heightCm ?? profile.currentMeasurement?.heightCm ?? 0,
      weightKg: patch.currentWeightKg ?? profile.currentMeasurement?.weightKg ?? 0,
      measuredAt: new Date().toISOString(),
    };
    next.currentMeasurement = measurement;
    next.measurements = [...profile.measurements, measurement];
  }

  next.onboardingCompleted = true;
  next.onboardingCompletedAt = next.onboardingCompletedAt ?? new Date().toISOString();

  profile = withNutrition(next);
  return profile;
}
