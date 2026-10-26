import { buildStreakWeek } from './streak';

describe('buildStreakWeek', () => {
  // 21/10/2026 é uma quarta-feira
  const today = new Date(2026, 9, 21);

  it('lists the last 7 days ending today, with weekday letters', () => {
    const week = buildStreakWeek(0, today);
    expect(week.map((d) => d.label)).toEqual(['Q', 'S', 'S', 'D', 'S', 'T', 'Q']);
    expect(week[6].isToday).toBe(true);
    expect(week.filter((d) => d.isToday)).toHaveLength(1);
  });

  it('marks the last N days as done', () => {
    expect(buildStreakWeek(0, today).some((d) => d.done)).toBe(false);
    expect(buildStreakWeek(3, today).map((d) => d.done)).toEqual([false, false, false, false, true, true, true]);
    expect(buildStreakWeek(12, today).every((d) => d.done)).toBe(true);
  });
});
