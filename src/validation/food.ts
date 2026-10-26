import type { FoodItem } from '@/api/types/domain';
import { parseDecimal } from '@/utils/nutrition';

export interface ManualFoodForm {
  name: string;
  brand: string;
  calories: string;
  protein: string;
  carbohydrates: string;
  fat: string;
}

export const INITIAL_MANUAL_FOOD_FORM: ManualFoodForm = {
  name: '',
  brand: '',
  calories: '',
  protein: '',
  carbohydrates: '',
  fat: '',
};

const MAX_NAME_LENGTH = 80;
const MAX_BRAND_LENGTH = 60;
// Gordura pura tem ~900 kcal por 100 g — acima disso é erro de digitação.
const MAX_CALORIES_PER_100G = 900;
const MAX_MACROS_SUM_G = 100;

const MACRO_FIELDS = [
  {
    key: 'protein',
    missing: 'Informe a proteína por 100 g.',
    negative: 'A proteína não pode ser negativa.',
  },
  {
    key: 'carbohydrates',
    missing: 'Informe o carboidrato por 100 g.',
    negative: 'O carboidrato não pode ser negativo.',
  },
  {
    key: 'fat',
    missing: 'Informe a gordura por 100 g.',
    negative: 'A gordura não pode ser negativa.',
  },
] as const;

export function validateManualFood(form: ManualFoodForm): string | null {
  const name = form.name.trim();
  if (!name) return 'Informe o nome do alimento.';
  if (name.length > MAX_NAME_LENGTH) {
    return `O nome deve ter no máximo ${MAX_NAME_LENGTH} caracteres.`;
  }
  if (form.brand.trim().length > MAX_BRAND_LENGTH) {
    return `A marca deve ter no máximo ${MAX_BRAND_LENGTH} caracteres.`;
  }

  const calories = parseDecimal(form.calories);
  if (calories === null) return 'Informe as calorias por 100 g.';
  if (calories < 0) return 'As calorias não podem ser negativas.';
  if (calories > MAX_CALORIES_PER_100G) {
    return `As calorias por 100 g devem ser no máximo ${MAX_CALORIES_PER_100G}.`;
  }

  let macrosSum = 0;
  for (const { key, missing, negative } of MACRO_FIELDS) {
    const value = parseDecimal(form[key]);
    if (value === null) return missing;
    if (value < 0) return negative;
    macrosSum += value;
  }
  if (macrosSum > MAX_MACROS_SUM_G) {
    return 'A soma de proteína, carboidrato e gordura não pode passar de 100 g por 100 g.';
  }

  return null;
}

// Só chamar depois de validateManualFood() devolver null.
export function buildManualFoodInput(
  form: ManualFoodForm,
): Omit<FoodItem, 'id' | 'source' | 'externalId'> {
  return {
    name: form.name.trim(),
    brand: form.brand.trim() || null,
    barcode: null,
    nutritionPer100g: {
      calories: parseDecimal(form.calories)!,
      protein: parseDecimal(form.protein)!,
      carbohydrates: parseDecimal(form.carbohydrates)!,
      fat: parseDecimal(form.fat)!,
      fiber: 0,
    },
  };
}
