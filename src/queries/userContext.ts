import { useAuthStore } from '@/store/authStore';
import { resolveTimezone } from '@/utils/today';
import { resolveCalorieGoal } from '@/utils/nutritionFallback';

// Dados do usuário que as consultas do dia precisam, lidos na hora de buscar.

// Fuso do usuário (perfil), ou o do aparelho.
export function currentTimezone(): string {
  return resolveTimezone(useAuthStore.getState().user?.timezone);
}

// Meta calórica do perfil (backend ou fallback local), para quando o
// progresso do backend vier sem meta.
export function currentCalorieGoal(): number | null {
  return resolveCalorieGoal(useAuthStore.getState().user);
}
