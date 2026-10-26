import type { MealType } from './types/domain';

// ÚNICO lugar que decide como o tipo e o nome do prato viajam para o backend
// real, que hoje só aceita `name`. Formato: "Tipo - Nome" (ou só "Tipo").
// Quando o backend ganhar um campo próprio `mealType`, troque estas duas
// funções (enviar/ler o campo direto) e o resto do app não muda.
//
// No modo mock nada disso é usado: tipo e nome ficam separados.

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Café da manhã',
  LUNCH: 'Almoço',
  DINNER: 'Jantar',
  SNACK: 'Lanche',
};

const SEPARATOR = ' - ';
const TYPES = Object.keys(MEAL_TYPE_LABELS) as MealType[];

export function encodeMealName(mealType: MealType, name?: string | null): string {
  const label = MEAL_TYPE_LABELS[mealType];
  const trimmed = name?.trim();
  return trimmed ? `${label}${SEPARATOR}${trimmed}` : label;
}

export interface DecodedMealName {
  mealType: MealType | null;
  name: string | null;
}

// Reconhece o tipo pelo prefixo EXATO de um dos rótulos fixos. Qualquer outra
// coisa (refeição antiga, nome livre) vira nome livre, sem quebrar.
export function decodeMealName(raw: string | null | undefined): DecodedMealName {
  const value = (raw ?? '').trim();
  if (!value) return { mealType: null, name: null };

  for (const type of TYPES) {
    const label = MEAL_TYPE_LABELS[type];
    if (value === label) return { mealType: type, name: null };
    if (value.startsWith(`${label}${SEPARATOR}`)) {
      const name = value.slice(label.length + SEPARATOR.length).trim();
      return { mealType: type, name: name || null };
    }
  }
  return { mealType: null, name: value };
}
