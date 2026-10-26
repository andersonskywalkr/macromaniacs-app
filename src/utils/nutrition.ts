import type { FoodItem } from '@/api/types/domain';

export const DEFAULT_AMOUNT_GRAMS = 100;
export const MAX_AMOUNT_GRAMS = 5000;

export interface ScaledNutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

// Aceita vírgula ou ponto como separador decimal (teclado pt-BR). Devolve
// null para vazio ou texto que não é um número.
export function parseDecimal(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  return Number(normalized);
}

export function validateAmount(raw: string): string | null {
  const amount = parseDecimal(raw);
  if (amount === null) return 'Informe a quantidade em gramas.';
  if (amount <= 0) return 'A quantidade deve ser maior que zero.';
  if (amount > MAX_AMOUNT_GRAMS) {
    return `A quantidade deve ser de no máximo ${MAX_AMOUNT_GRAMS} g.`;
  }
  return null;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Recalcula os valores nutricionais (dados por 100 g) para a quantidade
// informada. É só feedback visual — o backend recalcula os totais (RNF-02).
export function scaleNutrition(
  per100g: FoodItem['nutritionPer100g'],
  grams: number,
): ScaledNutrition {
  const factor = grams / 100;
  return {
    calories: Math.round(per100g.calories * factor),
    protein: round(per100g.protein * factor, 1),
    carbohydrates: round(per100g.carbohydrates * factor, 1),
    fat: round(per100g.fat * factor, 1),
  };
}

// 3.6 -> "3,6"; 32 -> "32" (uma casa decimal no máximo, vírgula pt-BR).
export function formatDecimal(value: number): string {
  return String(round(value, 1)).replace('.', ',');
}
