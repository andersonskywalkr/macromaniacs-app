import type { DailyProgressEntry } from '@/api/types/domain';

// Desempenho: tudo que a tela de Histórico e o atalho "Desempenho semanal" da
// Home calculam. UMA implementação só (os dois usam as mesmas funções).

// "Meta batida": calorias do dia entre 90% e 110% da meta.
// ATENÇÃO: esta definição AGUARDA validação da Nutrição.
export const GOAL_HIT_MIN_RATIO = 0.9;
export const GOAL_HIT_MAX_RATIO = 1.1;
// "Perto da meta" (só para o status do dia a dia): entre 80% e 120%.
export const GOAL_NEAR_MIN_RATIO = 0.8;
export const GOAL_NEAR_MAX_RATIO = 1.2;

export function isGoalHit(calories: number, goal: number | null | undefined): boolean {
  if (!goal || goal <= 0) return false;
  const ratio = calories / goal;
  return ratio >= GOAL_HIT_MIN_RATIO && ratio <= GOAL_HIT_MAX_RATIO;
}

export type DayStatus = 'hit' | 'near' | 'out' | 'none';

export interface PerformanceDay {
  date: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  mealCount: number;
  goal: number | null;
  // Teve algum registro no dia.
  hasRecord: boolean;
  hit: boolean;
  status: DayStatus;
}

// --- Datas (AAAA-MM-DD) ---

export function addDays(date: string, delta: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const moved = new Date(Date.UTC(year, month - 1, day + delta));
  return moved.toISOString().slice(0, 10);
}

export function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let current = from; current <= to; current = addDays(current, 1)) {
    dates.push(current);
    if (dates.length > 400) break; // proteção contra intervalo invertido/enorme
  }
  return dates;
}

// Os últimos `count` dias, terminando em `today` (o mais antigo primeiro).
export function lastDates(count: number, today: string): string[] {
  return datesBetween(addDays(today, -(count - 1)), today);
}

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function weekdayShort(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return WEEKDAY_SHORT[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

export function formatShortDate(date: string): string {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}

// --- Cálculo ---

function statusOf(calories: number, goal: number | null, hasRecord: boolean): DayStatus {
  if (!hasRecord) return 'none';
  if (!goal || goal <= 0) return 'out';
  if (isGoalHit(calories, goal)) return 'hit';
  const ratio = calories / goal;
  return ratio >= GOAL_NEAR_MIN_RATIO && ratio <= GOAL_NEAR_MAX_RATIO ? 'near' : 'out';
}

// Monta um ponto para cada data pedida: o que veio da API, ou um dia vazio
// (sem registro). `fallbackGoal` é a meta do perfil, usada quando o dia não
// traz meta.
export function buildPerformanceDays(
  dates: string[],
  entries: DailyProgressEntry[],
  fallbackGoal: number | null,
): PerformanceDay[] {
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));
  return dates.map((date) => {
    const entry = byDate.get(date);
    const calories = entry?.calories ?? 0;
    const goal = entry?.targetCalories ?? fallbackGoal;
    const hasRecord = Boolean(entry && (entry.mealCount > 0 || entry.calories > 0));
    return {
      date,
      calories,
      protein: entry?.protein ?? 0,
      carbohydrates: entry?.carbohydrates ?? 0,
      fat: entry?.fat ?? 0,
      mealCount: entry?.mealCount ?? 0,
      goal,
      hasRecord,
      hit: hasRecord && isGoalHit(calories, goal),
      status: statusOf(calories, goal, hasRecord),
    };
  });
}

export interface PerformanceSummary {
  totalDays: number;
  recordedDays: number;
  goalHitDays: number;
  // Médias só sobre os dias COM registro (dia sem registro não puxa a média).
  avgCalories: number;
  avgProtein: number;
  avgCarbohydrates: number;
  avgFat: number;
  bestDay: PerformanceDay | null;
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

// "Melhor dia": o dia com registro mais perto da meta (menor distância
// relativa); empate fica com o mais recente. Sem meta, vale o de mais calorias.
export function pickBestDay(days: PerformanceDay[]): PerformanceDay | null {
  const recorded = days.filter((day) => day.hasRecord);
  if (recorded.length === 0) return null;

  const distance = (day: PerformanceDay) =>
    day.goal && day.goal > 0 ? Math.abs(day.calories - day.goal) / day.goal : -day.calories;

  return recorded.reduce((best, day) => (distance(day) <= distance(best) ? day : best));
}

export function summarizePerformance(days: PerformanceDay[]): PerformanceSummary {
  const recorded = days.filter((day) => day.hasRecord);
  return {
    totalDays: days.length,
    recordedDays: recorded.length,
    goalHitDays: days.filter((day) => day.hit).length,
    avgCalories: average(recorded.map((day) => day.calories)),
    avgProtein: average(recorded.map((day) => day.protein)),
    avgCarbohydrates: average(recorded.map((day) => day.carbohydrates)),
    avgFat: average(recorded.map((day) => day.fat)),
    bestDay: pickBestDay(days),
  };
}

// Texto do atalho da Home (mesmo cálculo da tela de Histórico).
export function goalHitLabel(summary: Pick<PerformanceSummary, 'goalHitDays' | 'totalDays'>): string {
  return `Meta batida em ${summary.goalHitDays} de ${summary.totalDays} dias`;
}
