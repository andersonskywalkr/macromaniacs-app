import type { FoodItem } from '../types/domain';
import { round2, toNumber } from './common';

// Food como o backend devolve (todas as rotas de alimentos). Não há marca.
export interface ApiFood {
  id: string;
  name: string;
  source: string;
  externalId?: string | null;
  barcode?: string | null;
  caloriesPer100g: number | string;
  proteinPer100g: number | string;
  carbsPer100g: number | string;
  fatPer100g: number | string;
  fiberPer100g: number | string;
  servingSizeG?: number | string;
  retrievedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Corpo de POST /v1/foods/manual (campos soltos, sem objeto aninhado e sem marca).
export interface ApiManualFoodBody {
  name: string;
  barcode: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
}

const NAME_MAX = 255;
// 8, 12, 13 ou 14 dígitos
const BARCODE_PATTERN = /^(\d{8}|\d{12,14})$/;

export function fromApiFood(food: ApiFood): FoodItem {
  return {
    id: food.id,
    name: food.name,
    brand: null,
    source: food.source,
    externalId: food.externalId ?? null,
    barcode: food.barcode ?? null,
    nutritionPer100g: {
      calories: toNumber(food.caloriesPer100g),
      protein: toNumber(food.proteinPer100g),
      carbohydrates: toNumber(food.carbsPer100g),
      fat: toNumber(food.fatPer100g),
      fiber: toNumber(food.fiberPer100g),
    },
  };
}

// O backend não tem marca: ela é juntada ao nome ("Nome (Marca)"), cortando o
// nome (não a marca) se passar de 255 caracteres.
export function buildManualFoodName(name: string, brand?: string | null): string {
  const cleanName = name.trim();
  const cleanBrand = brand?.trim();
  if (!cleanBrand) return cleanName.slice(0, NAME_MAX);

  const suffix = ` (${cleanBrand})`;
  if (cleanName.length + suffix.length <= NAME_MAX) return `${cleanName}${suffix}`;
  return `${cleanName.slice(0, Math.max(1, NAME_MAX - suffix.length))}${suffix}`.slice(0, NAME_MAX);
}

export function toApiManualFood(
  input: Omit<FoodItem, 'id' | 'source' | 'externalId'>,
): ApiManualFoodBody {
  const { calories, protein, carbohydrates, fat, fiber } = input.nutritionPer100g;
  const barcode = input.barcode?.trim() ?? '';

  return {
    name: buildManualFoodName(input.name, input.brand),
    barcode: BARCODE_PATTERN.test(barcode) ? barcode : null,
    caloriesPer100g: round2(calories),
    proteinPer100g: round2(protein),
    carbsPer100g: round2(carbohydrates),
    fatPer100g: round2(fat),
    fiberPer100g: round2(fiber),
  };
}
