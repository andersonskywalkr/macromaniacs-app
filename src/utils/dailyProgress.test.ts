import {
  defaultMacroGoals,
  resolveMacroGoals,
  summarizeCalories,
  summarizeMacro,
} from './dailyProgress';

describe('summarizeCalories', () => {
  it('starts with everything remaining and an empty ring', () => {
    expect(summarizeCalories(2500, 0)).toEqual({
      goal: 2500,
      consumed: 0,
      remaining: 2500,
      over: 0,
      ringProgress: 0,
      percent: 0,
    });
  });

  it('computes remaining and ring progress below the goal', () => {
    const summary = summarizeCalories(2000, 500);
    expect(summary.remaining).toBe(1500);
    expect(summary.ringProgress).toBe(0.25);
    expect(summary.percent).toBe(25);
    expect(summary.over).toBe(0);
  });

  it('reports the excess and caps the ring at 100% when over the goal', () => {
    const summary = summarizeCalories(2000, 2120);
    expect(summary.remaining).toBe(0);
    expect(summary.over).toBe(120);
    expect(summary.ringProgress).toBe(1);
    expect(summary.percent).toBe(106);
  });

  it('does not break with a zero goal', () => {
    expect(summarizeCalories(0, 300)).toMatchObject({ ringProgress: 0, remaining: 0, over: 300 });
  });
});

describe('summarizeMacro', () => {
  it('computes the bar progress and percent', () => {
    expect(summarizeMacro(80, 160)).toEqual({ consumed: 80, goal: 160, barProgress: 0.5, percent: 50 });
  });

  it('caps the bar at 100% but keeps the real percent', () => {
    expect(summarizeMacro(200, 160)).toMatchObject({ barProgress: 1, percent: 125 });
  });

  it('handles a missing goal', () => {
    expect(summarizeMacro(10, 0)).toMatchObject({ barProgress: 0, percent: 0 });
  });
});

describe('default macro split (50% carbs, 25% protein, 25% fat)', () => {
  it('converts calories to grams with 4/4/9 kcal per gram', () => {
    expect(defaultMacroGoals(2000)).toEqual({ carbohydrates: 250, protein: 125, fat: 56 });
  });

  it('is used only for macros without a goal from the progress data', () => {
    expect(resolveMacroGoals(2000, { protein: 160, carbohydrates: 0, fat: undefined })).toEqual({
      protein: 160,
      carbohydrates: 250,
      fat: 56,
    });
    expect(resolveMacroGoals(2000)).toEqual(defaultMacroGoals(2000));
  });
});
