export interface MacroGoals {
  protein: number;
  carbohydrates: number;
  fat: number;
}

// Divisão padrão quando não há metas de macros: 50% carboidratos, 25%
// proteínas, 25% gorduras (4 kcal/g carbo e proteína, 9 kcal/g gordura).
export function defaultMacroGoals(calorieGoal: number): MacroGoals {
  return {
    carbohydrates: Math.round((calorieGoal * 0.5) / 4),
    protein: Math.round((calorieGoal * 0.25) / 4),
    fat: Math.round((calorieGoal * 0.25) / 9),
  };
}

export interface CalorieSummary {
  goal: number;
  consumed: number;
  // Nunca negativo: o que falta pra meta.
  remaining: number;
  // Quanto passou da meta (0 se não passou).
  over: number;
  // 0 a 1, limitado — é o que o anel desenha.
  ringProgress: number;
  // Percentual real, pode passar de 100 (texto de acessibilidade).
  percent: number;
}

export function summarizeCalories(goal: number, consumed: number): CalorieSummary {
  const safeGoal = Math.max(0, goal);
  const ratio = safeGoal > 0 ? consumed / safeGoal : 0;
  return {
    goal: safeGoal,
    consumed,
    remaining: Math.max(0, safeGoal - consumed),
    over: Math.max(0, consumed - safeGoal),
    ringProgress: Math.min(1, Math.max(0, ratio)),
    percent: Math.round(Math.max(0, ratio) * 100),
  };
}

export interface MacroSummary {
  consumed: number;
  goal: number;
  // 0 a 1, limitado — largura da barra.
  barProgress: number;
  percent: number;
}

export function summarizeMacro(consumed: number, goal: number): MacroSummary {
  const ratio = goal > 0 ? consumed / goal : 0;
  return {
    consumed,
    goal,
    barProgress: Math.min(1, Math.max(0, ratio)),
    percent: Math.round(Math.max(0, ratio) * 100),
  };
}

// Usa a meta de macro do progresso quando ela existe (> 0); senão cai na
// divisão padrão da meta calórica.
export function resolveMacroGoals(
  calorieGoal: number,
  fromProgress?: Partial<MacroGoals>,
): MacroGoals {
  const fallback = defaultMacroGoals(calorieGoal);
  const pick = (value: number | undefined, def: number) =>
    value !== undefined && value > 0 ? value : def;
  return {
    protein: pick(fromProgress?.protein, fallback.protein),
    carbohydrates: pick(fromProgress?.carbohydrates, fallback.carbohydrates),
    fat: pick(fromProgress?.fat, fallback.fat),
  };
}
