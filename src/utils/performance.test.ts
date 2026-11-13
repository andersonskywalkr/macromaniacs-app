import type { DailyProgressEntry } from '@/api/types/domain';
import {
  addDays,
  buildPerformanceDays,
  datesBetween,
  goalHitLabel,
  isGoalHit,
  lastDates,
  pickBestDay,
  summarizePerformance,
  weekdayShort,
} from './performance';

const entry = (
  date: string,
  calories: number,
  extra: Partial<DailyProgressEntry> = {},
): DailyProgressEntry => ({
  date,
  calories,
  protein: 100,
  carbohydrates: 200,
  fat: 60,
  fiber: 20,
  mealCount: 3,
  targetCalories: 2000,
  ...extra,
});

describe('isGoalHit (90% to 110% of the goal)', () => {
  it('includes the limits and excludes what is outside', () => {
    expect(isGoalHit(1800, 2000)).toBe(true);
    expect(isGoalHit(2200, 2000)).toBe(true);
    expect(isGoalHit(2000, 2000)).toBe(true);
    expect(isGoalHit(1799, 2000)).toBe(false);
    expect(isGoalHit(2201, 2000)).toBe(false);
  });

  it('is never a hit without a goal', () => {
    expect(isGoalHit(2000, null)).toBe(false);
    expect(isGoalHit(2000, 0)).toBe(false);
  });
});

describe('dates', () => {
  it('adds days across months and lists intervals', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(datesBetween('2026-10-29', '2026-11-01')).toEqual([
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
    expect(lastDates(7, '2026-10-22')).toEqual([
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
    ]);
    expect(lastDates(30, '2026-10-22')).toHaveLength(30);
  });

  it('names the weekday', () => {
    expect(weekdayShort('2026-10-21')).toBe('qua');
    expect(weekdayShort('2026-10-18')).toBe('dom');
  });
});

describe('buildPerformanceDays', () => {
  const dates = lastDates(7, '2026-10-22');

  it('creates a point for every day; days without a record are empty', () => {
    const days = buildPerformanceDays(dates, [entry('2026-10-22', 2000)], 2000);

    expect(days).toHaveLength(7);
    expect(days[0]).toMatchObject({ hasRecord: false, hit: false, status: 'none', calories: 0 });
    expect(days[6]).toMatchObject({ hasRecord: true, hit: true, status: 'hit' });
  });

  it('uses the profile goal when the day has none, and classifies near and out', () => {
    const days = buildPerformanceDays(
      ['2026-10-20', '2026-10-21', '2026-10-22'],
      [
        entry('2026-10-20', 1650, { targetCalories: null }), // 82,5% -> perto
        entry('2026-10-21', 900, { targetCalories: null }), // 45% -> fora
        entry('2026-10-22', 1900, { targetCalories: null }), // 95% -> batida
      ],
      2000,
    );

    expect(days.map((d) => d.goal)).toEqual([2000, 2000, 2000]);
    expect(days.map((d) => d.status)).toEqual(['near', 'out', 'hit']);
  });

  it('counts a day with meals as a record even with zero calories logged', () => {
    const days = buildPerformanceDays(['2026-10-22'], [entry('2026-10-22', 0, { mealCount: 1 })], 2000);
    expect(days[0].hasRecord).toBe(true);
    expect(days[0].hit).toBe(false);
  });
});

describe('summarizePerformance', () => {
  const dates = lastDates(7, '2026-10-22');
  const days = buildPerformanceDays(
    dates,
    [
      entry('2026-10-17', 1900, { protein: 120, carbohydrates: 220, fat: 50 }), // batida
      entry('2026-10-18', 2100, { protein: 100, carbohydrates: 260, fat: 70 }), // batida
      entry('2026-10-20', 1000, { protein: 60, carbohydrates: 120, fat: 30 }), // fora
      entry('2026-10-22', 2300, { protein: 140, carbohydrates: 300, fat: 90 }), // perto
    ],
    2000,
  );

  it('counts the days with the goal hit, out of all days of the period', () => {
    const summary = summarizePerformance(days);
    expect(summary.totalDays).toBe(7);
    expect(summary.recordedDays).toBe(4);
    expect(summary.goalHitDays).toBe(2);
    expect(goalHitLabel(summary)).toBe('Meta batida em 2 de 7 dias');
  });

  it('averages only over the days with a record', () => {
    const summary = summarizePerformance(days);
    expect(summary.avgCalories).toBe(1825); // (1900 + 2100 + 1000 + 2300) / 4
    expect(summary.avgProtein).toBe(105);
    expect(summary.avgCarbohydrates).toBe(225);
    expect(summary.avgFat).toBe(60);
  });

  it('picks the best day as the one closest to the goal (ties go to the latest)', () => {
    // 1900 e 2100 ficam a 5% da meta: no empate vale o mais recente
    expect(summarizePerformance(days).bestDay?.date).toBe('2026-10-18');
  });

  it('is empty-safe', () => {
    const empty = summarizePerformance(buildPerformanceDays(dates, [], 2000));
    expect(empty).toMatchObject({ recordedDays: 0, goalHitDays: 0, avgCalories: 0, bestDay: null });
    expect(pickBestDay([])).toBeNull();
  });
});
